/**
 * Shopify Configuration
 * Update these values with your actual Shopify store information
 */

const SHOPIFY_CONFIG = {
    // Your Shopify store domain (without https://)
    domain: 'your-shop.myshopify.com',
    
    // Your Storefront Access Token (public token - safe to expose)
    storefrontAccessToken: 'your-storefront-access-token-here',
    
    // API version (keep this updated)
    apiVersion: '2024-01',
    
    // Checkout settings
    checkout: {
        // Maximum items per checkout
        maxItems: 50,
        
        // Maximum quantity per item
        maxQuantityPerItem: 10,
        
        // Auto-redirect to checkout after adding items
        autoRedirect: false
    },
    
    // Cart settings
    cart: {
        // Persist cart in localStorage as fallback
        persistLocal: true,
        
        // Sync local cart with Shopify
        syncWithShopify: true
    },
    
    // Product settings
    products: {
        // Default image for products without images
        defaultImage: '/placeholder-image.jpg',
        
        // Image loading strategy
        imageLoading: 'lazy'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SHOPIFY_CONFIG;
} else {
    // Make available globally
    window.SHOPIFY_CONFIG = SHOPIFY_CONFIG;
}
