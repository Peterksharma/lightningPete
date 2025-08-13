/**
 * Shopify Configuration
 * Update these values with your actual Shopify store information
 */

const SHOPIFY_CONFIG = {
    // Mock.Shop domain (free prototyping API)
    domain: 'mock.shop',

    // Mock.Shop doesn't require an access token
    storefrontAccessToken: null, // Not needed for Mock.Shop

    // Mock.Shop API version
    apiVersion: '2023-01',

    // Use Mock.Shop base URL
    baseUrl: 'https://mock.shop/api',

    // Checkout settings
    checkout: {
        maxItems: 50,
        maxQuantityPerItem: 10,
        autoRedirect: false,
        // Mock checkout URL for testing
        mockCheckoutUrl: 'https://mock.shop/checkout'
    },

    cart: {
        persistLocal: true,
        syncWithShopify: false, // Set to false for Mock.Shop
        useMockData: true // Flag to indicate we're using mock data
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
