const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const minify = require('minify');

class PerformanceBuilder {
    constructor() {
        this.srcDir = path.join(__dirname, 'src');
        this.dataDir = path.join(__dirname, 'data');
        this.distDir = path.join(__dirname, 'dist');
        this.templatesDir = path.join(this.srcDir, 'templates');
        
        // Ensure dist directory exists
        fs.ensureDirSync(this.distDir);
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

    // Process component templates
    processComponents(baseTemplate, components, pageData) {
        let result = baseTemplate;
        const componentPlaceholder = '{{COMPONENTS}}';
        let componentsHTML = '';

        // Load and process each component
        components.forEach(componentName => {
            const componentPath = path.join(this.templatesDir, 'components', `${componentName}.html`);
            const componentTemplate = this.readTemplate(componentPath);
            
            if (componentTemplate && pageData[componentName]) {
                const processedComponent = this.replaceVariables(componentTemplate, pageData[componentName]);
                componentsHTML += processedComponent + '\n';
            }
        });

        return result.replace(componentPlaceholder, componentsHTML);
    }

    // Inline CSS files
    inlineCSS() {
        const cssFiles = ['critical.css', 'components.css'];
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
        if (fs.existsSync(jsPath)) {
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            return `<script>${jsContent}</script>`;
        }
        return '';
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

        // Process components
        const components = pageData.page?.components || [];
        let html = this.processComponents(baseTemplate, components, pageData);

        // Replace page-level variables
        html = this.replaceVariables(html, {
            ...siteConfig,
            ...pageData.page
        });

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
