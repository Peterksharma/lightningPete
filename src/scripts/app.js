// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    const app = document.getElementById('app');
    
    // Remove loading state
    if (app) {
        app.classList.add('loaded');
    }
    
    // Initialize security manager
    const securityManager = new SecurityManager();
    
    // Cart system now handled by Mock.Shop cart
    
    // Mobile navigation functionality
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
                navToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            }
        });
        
        // Close mobile menu on window resize (if switching to desktop)
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) {
                navToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            }
        });
    }
    
    // Shop filtering functionality
    initializeShopFilters();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const paintMetrics = performance.getEntriesByType('paint');
            paintMetrics.forEach(metric => {
                console.log(`${metric.name}: ${Math.round(metric.startTime)}ms`);
            });
            
            // Log Core Web Vitals
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            console.log(`${entry.name}: ${Math.round(entry.value)}`);
                        }
                    });
                    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
                } catch (e) {
                    console.log('PerformanceObserver not supported');
                }
            }
            
            // Initialize image loading states
            initializeImageLoading();
        });
    }
});

// Cart system now handled by Mock.Shop cart

// Shop filtering system
function initializeShopFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const productsGrid = document.getElementById('productsGrid');
    const paginationInfo = document.querySelector('.pagination-info');
    
    if (!categoryFilter || !priceFilter || !productsGrid) {
        return; // Not on shop page
    }
    
    // Store all products for filtering
    const allProducts = Array.from(productsGrid.querySelectorAll('.product-card'));
    
    // Filter change handlers
    categoryFilter.addEventListener('change', filterProducts);
    priceFilter.addEventListener('change', filterProducts);
    
    function filterProducts() {
        const selectedCategory = categoryFilter.value;
        const selectedPrice = priceFilter.value;
        
        let visibleCount = 0;
        
        allProducts.forEach(product => {
            const productCategory = product.dataset.category;
            const productPrice = parseFloat(product.dataset.price);
            
            let shouldShow = true;
            
            // Category filter
            if (selectedCategory && productCategory !== selectedCategory) {
                shouldShow = false;
            }
            
            // Price filter
            if (selectedPrice && shouldShow) {
                const [minPrice, maxPrice] = parsePriceRange(selectedPrice);
                
                if (maxPrice === null) {
                    // $100+ case
                    if (productPrice < minPrice) {
                        shouldShow = false;
                    }
                } else {
                    if (productPrice < minPrice || productPrice > maxPrice) {
                        shouldShow = false;
                    }
                }
            }
            
            // Show/hide product
            if (shouldShow) {
                product.style.display = 'block';
                visibleCount++;
                
                // Add fade-in animation
                product.style.opacity = '0';
                product.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    product.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    product.style.opacity = '1';
                    product.style.transform = 'translateY(0)';
                }, 50);
            } else {
                product.style.display = 'none';
            }
        });
        
        // Update product count
        updateProductCount(visibleCount);
        
        // Show "no results" message if needed
        showNoResultsMessage(visibleCount === 0);
    }
    
    function parsePriceRange(priceRange) {
        switch (priceRange) {
            case '0-25':
                return [0, 25];
            case '25-50':
                return [25, 50];
            case '50-100':
                return [50, 100];
            case '100+':
                return [100, null];
            default:
                return [0, null];
        }
    }
    
    function updateProductCount(count) {
        if (paginationInfo) {
            paginationInfo.innerHTML = `Showing ${count} of ${allProducts.length} products`;
        }
    }
    
    function showNoResultsMessage(show) {
        let noResultsMsg = document.querySelector('.no-results-message');
        
        if (show) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results-message';
                noResultsMsg.innerHTML = `
                    <div class="no-results-content">
                        <h3>No products found</h3>
                        <p>Try adjusting your filters or browse all categories.</p>
                        <button class="clear-filters-btn" onclick="clearAllFilters()">Clear All Filters</button>
                    </div>
                `;
                productsGrid.parentNode.insertBefore(noResultsMsg, productsGrid.nextSibling);
            }
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }
    
    // Clear all filters function (global for onclick)
    window.clearAllFilters = function() {
        categoryFilter.value = '';
        priceFilter.value = '';
        filterProducts();
        
        // Scroll to top of products
        productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    
    // Initialize product count
    updateProductCount(allProducts.length);
}

// Mock.Shop cart handles add to cart functionality
// No need for separate event listeners

// Image loading state management
function initializeImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    images.forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
            
            img.addEventListener('error', () => {
                console.warn('Image failed to load:', img.src);
                // Could show fallback image here
            });
        }
    });
    
    // Monitor image loading performance
    if ('PerformanceObserver' in window) {
        try {
            const imageObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name.includes('image')) {
                        console.log(`Image load time: ${Math.round(entry.duration)}ms for ${entry.name}`);
                    }
                }
            });
            imageObserver.observe({ entryTypes: ['resource'] });
        } catch (e) {
            console.log('Resource PerformanceObserver not supported');
        }
    }
}
