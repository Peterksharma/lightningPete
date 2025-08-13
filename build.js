const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const minify = require('minify');
const https = require('https');
const crypto = require('crypto');

class PerformanceBuilder {
    constructor() {
        this.srcDir = path.join(__dirname, 'src');
        this.dataDir = path.join(__dirname, 'data');
        this.distDir = path.join(__dirname, 'dist');
        this.templatesDir = path.join(this.srcDir, 'templates');
        
        // Ensure dist directory exists
        fs.ensureDirSync(this.distDir);
    }

    // Generate CSRF token for security
    generateCSRFToken() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(16).toString('hex');
        const payload = `${timestamp}:${random}`;
        return Buffer.from(payload).toString('base64');
    }

    // Fetch data from external API
    async fetchShopData() {
        return new Promise((resolve, reject) => {
            const url = 'https://mock.shop/api?query=%7B%20products(first%3A%2020)%20%7B%20edges%20%7B%20node%20%7B%20id%20title%20description%20featuredImage%20%7B%20id%20url%20%7D%20variants(first%3A%203)%20%7B%20edges%20%7B%20node%20%7B%20price%20%7B%20amount%20currencyCode%20%7D%20%7D%20%7D%20%7D%20%7D%20%7D%20%7D%7D';
            
            https.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (error) {
                        console.error('Error parsing shop data:', error.message);
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                console.error('Error fetching shop data:', error.message);
                reject(error);
            });
        });
    }

    // Generate optimized image HTML with responsive sizing
    generateOptimizedImageHTML(imageUrl, productTitle) {
        if (!imageUrl) {
            return `<div class="product-placeholder">${productTitle}</div>`;
        }

        // Generate responsive image sizes for different viewport widths
        const sizes = [
            { width: 300, suffix: '300w' },
            { width: 400, suffix: '400w' },
            { width: 600, suffix: '600w' },
            { width: 800, suffix: '800w' },
            { width: 1200, suffix: '1200w' }
        ];

        // Create srcset for responsive images with better sizing
        const srcset = sizes.map(size => {
            // For now, we'll use the original image but with proper sizing
            // In production, you'd resize images to these exact dimensions
            return `${imageUrl} ${size.suffix}`;
        }).join(', ');

        // Generate WebP version if possible (Shopify often provides this)
        const webpUrl = imageUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const webpSrcset = sizes.map(size => {
            return `${webpUrl} ${size.suffix}`;
        }).join(', ');

        // Determine if this is likely a critical above-the-fold image
        const isCriticalImage = this.isCriticalImage(imageUrl);

        return `
            <picture>
                <source 
                    type="image/webp" 
                    srcset="${webpSrcset}"
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                >
                <img 
                    src="${imageUrl}" 
                    srcset="${srcset}"
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    alt="${productTitle}"
                    loading="${isCriticalImage ? 'eager' : 'lazy'}"
                    width="400"
                    height="400"
                    style="aspect-ratio: 1; object-fit: cover;"
                    ${isCriticalImage ? 'fetchpriority="high"' : ''}
                >
            </picture>
            ${isCriticalImage ? `<link rel="preload" as="image" href="${imageUrl}">` : ''}
        `;
    }

    // Determine if image is likely critical (above-the-fold)
    isCriticalImage(imageUrl) {
        // First few products are likely above-the-fold
        // This is a simple heuristic - in production you'd use more sophisticated logic
        return true; // For now, treat all as critical for better performance
    }

    // Generate product HTML from shop data with optimized images
    generateProductHTML(products) {
        const productCardTemplate = this.readTemplate(path.join(this.templatesDir, 'components', 'product-card.html'));
        let productsHTML = '';
        let categoryOptions = new Set();
        
        products.forEach(product => {
            const node = product.node;
            const price = node.variants.edges[0]?.node.price.amount || '0';
            const currency = node.variants.edges[0]?.node.price.currencyCode || 'USD';
            
            // Extract category from title (simple approach)
            const category = this.extractCategory(node.title);
            categoryOptions.add(category);
            
            // Generate optimized image HTML
            const optimizedImage = this.generateOptimizedImageHTML(
                node.featuredImage?.url, 
                node.title
            );
            
            let productHTML = productCardTemplate
                .replace(/\{\{PRODUCT_ID\}\}/g, node.id)
                .replace(/\{\{PRODUCT_TITLE\}\}/g, node.title)
                .replace(/\{\{PRODUCT_DESCRIPTION\}\}/g, node.description)
                .replace(/\{\{PRODUCT_IMAGE_HTML\}\}/g, optimizedImage)
                .replace(/\{\{PRODUCT_IMAGE_URL\}\}/g, node.featuredImage?.url || '')
                .replace(/\{\{PRODUCT_PRICE\}\}/g, price)
                .replace(/\{\{PRODUCT_CURRENCY\}\}/g, currency)
                .replace(/\{\{PRODUCT_CATEGORY\}\}/g, category);
            
            productsHTML += productHTML;
        });
        
        return {
            productsHTML,
            categoryOptions: Array.from(categoryOptions).sort(),
            productsCount: products.length
        };
    }

    // Extract category from product title
    extractCategory(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('hoodie')) return 'Hoodies';
        if (titleLower.includes('shirt') || titleLower.includes('tshirt')) return 'T-Shirts';
        if (titleLower.includes('crewneck')) return 'Crewnecks';
        if (titleLower.includes('sweatpants')) return 'Sweatpants';
        if (titleLower.includes('shorts')) return 'Shorts';
        if (titleLower.includes('leggings')) return 'Leggings';
        if (titleLower.includes('puffer') || titleLower.includes('jacket')) return 'Outerwear';
        if (titleLower.includes('sneakers') || titleLower.includes('shoes')) return 'Footwear';
        if (titleLower.includes('slides')) return 'Slides';
        if (titleLower.includes('frontpack') || titleLower.includes('bag')) return 'Bags';
        return 'Other';
    }

    // Read and parse JSON data
    readJSONData(filePath) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error.message);
            return {};
        }
    }

    // Read template file
    readTemplate(templatePath) {
        try {
            return fs.readFileSync(templatePath, 'utf8');
        } catch (error) {
            console.error(`Error reading template ${templatePath}:`, error.message);
            return '';
        }
    }

    // Simple template variable replacement
    replaceVariables(template, data, prefix = '') {
        let result = template;
        
        Object.keys(data).forEach(key => {
            const value = data[key];
            const placeholder = `{{${prefix}${key.toUpperCase()}}}`;
            
            if (typeof value === 'object' && value !== null) {
                // Handle nested objects
                result = this.replaceVariables(result, value, `${prefix}${key.toUpperCase()}_`);
            } else {
                // Replace simple values
                result = result.replace(new RegExp(placeholder, 'g'), value || '');
            }
        });
        
        return result;
    }

    // Process component templates with dynamic data
    async processComponents(baseTemplate, components, pageData) {
        let result = baseTemplate;
        const componentPlaceholder = '{{COMPONENTS}}';
        let componentsHTML = '';

        // Load and process each component
        for (const componentName of components) {
            const componentPath = path.join(this.templatesDir, 'components', `${componentName}.html`);
            const componentTemplate = this.readTemplate(componentPath);
            
            if (componentTemplate && pageData[componentName]) {
                let processedComponent = this.replaceVariables(componentTemplate, pageData[componentName]);
                
                // Special handling for shop component
                if (componentName === 'shop' && pageData[componentName].products) {
                    const shopData = pageData[componentName];
                    if (shopData.products.length > 0) {
                        const { productsHTML, categoryOptions, productsCount } = this.generateProductHTML(shopData.products);
                        
                        // Generate category options HTML
                        const categoryOptionsHTML = categoryOptions.map(cat => 
                            `<option value="${cat}">${cat}</option>`
                        ).join('');
                        
                        processedComponent = processedComponent
                            .replace('{{PRODUCTS_HTML}}', productsHTML)
                            .replace('{{CATEGORY_OPTIONS}}', categoryOptionsHTML)
                            .replace('{{PRODUCTS_COUNT}}', productsCount);
                    }
                }
                
                componentsHTML += processedComponent + '\n';
            }
        }

        return result.replace(componentPlaceholder, componentsHTML);
    }

    // Inline CSS files
    inlineCSS() {
        const cssFiles = ['critical.css', 'components.css', 'checkout.css'];
        let combinedCSS = '';
        
        cssFiles.forEach(cssFile => {
            const cssPath = path.join(this.srcDir, 'styles', cssFile);
            if (fs.existsSync(cssPath)) {
                combinedCSS += fs.readFileSync(cssPath, 'utf8') + '\n';
            }
        });
        
        return `<style>${combinedCSS}</style>`;
    }

    // Inline JavaScript
    inlineJS() {
        const jsPath = path.join(this.srcDir, 'scripts', 'app.js');
        const securityPath = path.join(this.srcDir, 'scripts', 'security.js');
        let combinedJS = '';
        
        // Load security script first
        if (fs.existsSync(securityPath)) {
            combinedJS += fs.readFileSync(securityPath, 'utf8') + '\n';
        }

        // Load Shopify config
        const shopifyConfigPath = path.join(this.srcDir, 'config', 'shopify-config.js');
        if (fs.existsSync(shopifyConfigPath)) {
            combinedJS += fs.readFileSync(shopifyConfigPath, 'utf8') + '\n';
        }

        // Load Shopify client script
        const shopifyPath = path.join(this.srcDir, 'scripts', 'shopify-client.js');
        if (fs.existsSync(shopifyPath)) {
            combinedJS += fs.readFileSync(shopifyPath, 'utf8') + '\n';
        }

        // Load performance checkout system
        const performanceCheckoutPath = path.join(this.srcDir, 'scripts', 'performance-checkout.js');
        if (fs.existsSync(performanceCheckoutPath)) {
            combinedJS += fs.readFileSync(performanceCheckoutPath, 'utf8') + '\n';
        }

        // Load Mock.Shop cart system
        const mockShopCartPath = path.join(this.srcDir, 'scripts', 'mock-shop-cart.js');
        if (fs.existsSync(mockShopCartPath)) {
            combinedJS += fs.readFileSync(mockShopCartPath, 'utf8') + '\n';
        }

        // Load main app script
        if (fs.existsSync(jsPath)) {
            combinedJS += fs.readFileSync(jsPath, 'utf8') + '\n';
        }
        
        return `<script>${combinedJS}</script>`;
    }

    // Build a single page
    async buildPage(pageFile) {
        const pageName = path.basename(pageFile, '.json');
        const pageData = this.readJSONData(pageFile);
        const siteConfig = this.readJSONData(path.join(this.dataDir, 'site-config.json'));
        
        console.log(`Building page: ${pageName}`);

        // Load base template
        const baseTemplate = this.readTemplate(path.join(this.templatesDir, 'base.html'));
        if (!baseTemplate) {
            console.error(`Base template not found`);
            return;
        }

        // Special handling for shop page - fetch data at build time
        if (pageName === 'shop') {
            try {
                console.log('Fetching shop data...');
                const shopData = await this.fetchShopData();
                if (shopData.data && shopData.data.products) {
                    pageData.shop.products = shopData.data.products.edges;
                    console.log(`Fetched ${shopData.data.products.edges.length} products`);
                }
            } catch (error) {
                console.error('Failed to fetch shop data:', error.message);
                // Use fallback data or empty products array
                pageData.shop.products = [];
            }
        }

        // Process components
        const components = pageData.page?.components || [];
        let html = await this.processComponents(baseTemplate, components, pageData);

        // Replace page-level variables
        html = html.replace(/\{\{LANGUAGE\}\}/g, siteConfig.language || 'en');
        html = html.replace(/\{\{TITLE\}\}/g, pageData.page.title || '');
        html = html.replace(/\{\{DESCRIPTION\}\}/g, pageData.page.description || '');
        
        // Add security features
        const csrfToken = this.generateCSRFToken();
        html = html.replace('{{CSRF_TOKEN}}', csrfToken);

        // Inline CSS and JS
        html = html.replace('{{INLINE_CSS}}', this.inlineCSS());
        html = html.replace('{{INLINE_JS}}', this.inlineJS());

        // Clean up any remaining placeholders
        html = html.replace(/\{\{[^}]+\}\}/g, '');

        // Minify HTML (optional - comment out for debugging)
        try {
            html = await minify.html(html);
        } catch (error) {
            console.warn('Minification failed, using unminified HTML');
        }

        // Write output file - special case for home page
        let outputFileName = `${pageName}.html`;
        if (pageName === 'home') {
            outputFileName = 'index.html';
        }
        
        const outputPath = path.join(this.distDir, outputFileName);
        fs.writeFileSync(outputPath, html);
        
        console.log(`✓ Built: ${outputPath}`);
    }

    // Build all pages
    async build() {
        console.log('🚀 Starting build process...');
        
        // Find all page JSON files
        const pageFiles = glob.sync(path.join(this.dataDir, 'pages', '*.json'));
        
        if (pageFiles.length === 0) {
            console.error('No page files found in data/pages/');
            return;
        }

        // Build each page
        for (const pageFile of pageFiles) {
            await this.buildPage(pageFile);
        }

        console.log(`✅ Build complete! ${pageFiles.length} pages built.`);
        console.log(`📁 Output directory: ${this.distDir}`);
    }
}

// Run the build
const builder = new PerformanceBuilder();
builder.build().catch(console.error);
