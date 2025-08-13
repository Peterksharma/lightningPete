// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    const app = document.getElementById('app');
    
    // Remove loading state
    if (app) {
        app.classList.add('loaded');
    }
    
    // Initialize security manager
    const securityManager = new SecurityManager();
    
    // Initialize cart system with security
    initializeCart(securityManager);
    
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

// Secure Cart System
function initializeCart(securityManager) {
    // Load cart from localStorage
    loadCart();
    
    // Update cart badge
    updateCartBadge();
    
    // Close cart when clicking outside
    document.addEventListener('click', function(event) {
        const cartDropdown = document.getElementById('cartDropdown');
        const cartIcon = document.querySelector('.cart-icon');
        
        // Don't close if clicking on cart icon or inside cart dropdown
        if (cartDropdown && cartIcon) {
            const isClickingCartIcon = cartIcon.contains(event.target);
            const isClickingInsideCart = cartDropdown.contains(event.target);
            const isClickingQuantityButton = event.target.classList.contains('qty-btn');
            const isClickingRemoveButton = event.target.classList.contains('remove-item-btn');
            
            // Only close if clicking outside both cart icon and dropdown
            if (!isClickingCartIcon && !isClickingInsideCart) {
                cartDropdown.style.display = 'none';
            }
        }
    });
    
    // Store security manager reference
    window.cartSecurityManager = securityManager;
}

// Cart state management
let cart = [];

function loadCart() {
    try {
        const savedCart = localStorage.getItem('performance-builder-cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        
        // Validate existing cart data
        if (cart.length > 0) {
            try {
                cart = window.cartSecurityManager.validateCart(cart);
            } catch (error) {
                console.warn('Invalid cart data found, clearing cart:', error.message);
                cart = [];
                saveCart();
            }
        }
    } catch (error) {
        console.warn('Failed to load cart from localStorage:', error);
        cart = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem('performance-builder-cart', JSON.stringify(cart));
    } catch (error) {
        console.warn('Failed to save cart to localStorage:', error);
    }
}

function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Global cart functions with security
window.toggleCartDropdown = function() {
    const dropdown = document.getElementById('cartDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display !== 'none';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            renderCartItems();
        }
    }
};

window.addToCart = function(productId, productTitle, productPrice, productImage) {
    // Rate limiting check
    if (!window.cartSecurityManager.checkRateLimit('add-to-cart')) {
        showSecurityMessage('Rate limit exceeded. Please wait before adding more items.');
        return;
    }
    
    // Validate input data
    const cartItem = {
        id: productId,
        title: productTitle,
        price: parseFloat(productPrice),
        image: productImage,
        quantity: 1
    };
    
    // Validate cart item through security manager
    const validatedItem = window.cartSecurityManager.validateCartItem(cartItem);
    if (!validatedItem) {
        showSecurityMessage('Invalid product data. Please refresh and try again.');
        return;
    }
    
    // Try to add to Shopify first if available
    if (window.shopify && window.shopify.isAvailable()) {
        // For now, we'll use the local cart as fallback
        // In production, you'd map productId to actual Shopify variant ID
        console.log('Shopify available, but using local cart for now');
    }
    
    // Use local cart system
    const existingItem = cart.find(item => item.id === validatedItem.id);
    
    if (existingItem) {
        // Check quantity limits
        if (existingItem.quantity >= 10) {
            showSecurityMessage('Maximum quantity (10) reached for this item.');
            return;
        }
        existingItem.quantity += 1;
    } else {
        // Check cart size limits
        if (cart.length >= 50) {
            showSecurityMessage('Cart is full. Please remove some items before adding more.');
            return;
        }
        cart.push(validatedItem);
    }
    
    // Save and update
    saveCart();
    updateCartBadge();
    
    // Show success feedback
    showAddToCartFeedback();
    
    // Auto-open cart dropdown
    setTimeout(() => {
        const dropdown = document.getElementById('cartDropdown');
        if (dropdown) {
            dropdown.style.display = 'block';
            renderCartItems();
        }
    }, 300);
};

window.removeFromCart = function(productId) {
    // Rate limiting check
    if (!window.cartSecurityManager.checkRateLimit('remove-from-cart')) {
        showSecurityMessage('Rate limit exceeded. Please wait before removing more items.');
        return;
    }
    
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    renderCartItems();
};

window.updateCartQuantity = function(productId, newQuantity) {
    // Rate limiting check
    if (!window.cartSecurityManager.checkRateLimit('update-quantity')) {
        showSecurityMessage('Rate limit exceeded. Please wait before updating quantities.');
        return;
    }
    
    // Validate quantity
    if (!Number.isInteger(newQuantity) || newQuantity < 0 || newQuantity > 10) {
        showSecurityMessage('Invalid quantity. Must be between 0 and 10.');
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart();
            updateCartBadge();
            renderCartItems();
            
            // Ensure cart stays open after quantity update
            const cartDropdown = document.getElementById('cartDropdown');
            if (cartDropdown) {
                cartDropdown.style.display = 'block';
            }
        }
    }
};

function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartItems.innerHTML = `
        ${cart.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <div class="cart-item-price">$${item.price}</div>
                    <div class="cart-item-quantity">
                        <button onclick="event.stopPropagation(); updateCartQuantity('${item.id}', ${item.quantity - 1})" class="qty-btn">-</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button onclick="event.stopPropagation(); updateCartQuantity('${item.id}', ${item.quantity + 1})" class="qty-btn">+</button>
                    </div>
                </div>
                <button onclick="event.stopPropagation(); removeFromCart('${item.id}')" class="remove-item-btn" aria-label="Remove item">×</button>
            </div>
        `).join('')}
        <div class="cart-total">
            <strong>Total: $${total.toFixed(2)}</strong>
        </div>
        <div class="cart-actions">
            <button onclick="proceedToCheckout()" class="checkout-btn">
                Checkout with Shopify
            </button>
        </div>
    `;
}

function showAddToCartFeedback() {
    // Create temporary success message
    const feedback = document.createElement('div');
    feedback.className = 'add-to-cart-feedback';
    feedback.textContent = '✓ Added to cart!';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(feedback);
    
    // Remove after 2 seconds
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 300);
    }, 2000);
}

function showSecurityMessage(message) {
    // Create temporary security message
    const feedback = document.createElement('div');
    feedback.className = 'security-message';
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(feedback);
    
    // Remove after 3 seconds
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 300);
    }, 3000);
}

window.proceedToCheckout = function() {
    if (cart.length === 0) {
        showSecurityMessage('Your cart is empty!');
        return;
    }
    
    // Rate limiting check
    if (!window.cartSecurityManager.checkRateLimit('checkout')) {
        showSecurityMessage('Rate limit exceeded. Please wait before checking out.');
        return;
    }
    
    // Validate cart before checkout
    try {
        const validatedCart = window.cartSecurityManager.validateCart(cart);
        
        // Use Shopify checkout if available
        if (window.shopify && window.shopify.isAvailable()) {
            showSecurityMessage('Processing checkout with Shopify...');
            
            // Convert local cart to Shopify format
            // Note: You'll need to map your product IDs to actual Shopify variant IDs
            const shopifyCart = validatedCart.map(item => ({
                variantId: item.id, // This should be a real Shopify variant ID
                quantity: item.quantity
            }));
            
            // Add items to Shopify checkout
            Promise.all(shopifyCart.map(item => 
                window.shopify.addProduct(item.variantId, item.quantity)
            )).then(() => {
                // Proceed to Shopify checkout
                window.shopify.proceedToCheckout();
            }).catch(error => {
                console.error('Failed to add items to Shopify:', error);
                showSecurityMessage('Failed to process checkout. Please try again.');
            });
            
        } else {
            // Fallback to local checkout
            showSecurityMessage('Shopify checkout not available. Using local checkout.');
            console.log('Local checkout with validated items:', validatedCart);
            // TODO: Implement local checkout fallback
        }
        
    } catch (error) {
        showSecurityMessage('Cart validation failed. Please refresh and try again.');
        console.error('Checkout validation failed:', error);
    }
};

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
