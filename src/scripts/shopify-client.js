/**
 * Pure JavaScript Shopify Storefront Client
 * No external packages required - uses native fetch API
 * Safe to include in your static site
 */

class PureShopifyClient {
    constructor() {
        // ✅ Public token - safe to expose
        this.domain = window.SHOPIFY_CONFIG?.domain || 'mock.shop';
        this.storefrontAccessToken = window.SHOPIFY_CONFIG?.storefrontAccessToken || null;
        this.apiVersion = window.SHOPIFY_CONFIG?.apiVersion || '2023-01';
        this.checkout = null;
        this.isInitialized = false;
        
        // Check if we're using Mock.Shop
        this.isMockShop = this.domain === 'mock.shop';
        
        if (!this.isMockShop) {
            this.init();
        } else {
            console.log('🛍️ Mock.Shop detected - skipping Shopify checkout initialization');
            this.isInitialized = true;
        }
    }
    
    async init() {
        // Skip initialization for Mock.Shop
        if (this.isMockShop) {
            return;
        }
        
        try {
            // Create a new checkout session using GraphQL
            const checkout = await this.createCheckout();
            if (checkout) {
                this.checkout = checkout;
                this.isInitialized = true;
                console.log('✅ Shopify checkout initialized:', this.checkout.id);
                this.updateCartDisplay();
            }
        } catch (error) {
            console.error('❌ Failed to initialize Shopify checkout:', error);
            this.isInitialized = false;
        }
    }
    
    // GraphQL query to create checkout
    async createCheckout() {
        // Skip for Mock.Shop
        if (this.isMockShop) {
            return null;
        }
        
        const mutation = `
            mutation checkoutCreate($input: CheckoutCreateInput!) {
                checkoutCreate(input: $input) {
                    checkout {
                        id
                        webUrl
                        lineItems(first: 50) {
                            edges {
                                node {
                                    id
                                    title
                                    quantity
                                    variant {
                                        id
                                        title
                                        price
                                        image {
                                            url
                                        }
                                    }
                                }
                            }
                        }
                        subtotalPrice
                        totalPrice
                        ready
                    }
                    checkoutUserErrors {
                        code
                        field
                        message
                    }
                }
            }
        `;
        
        try {
            const response = await fetch(`https://${this.domain}/api/${this.apiVersion}/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: {
                        input: {}
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.data?.checkoutCreate?.checkout) {
                return data.data.checkoutCreate.checkout;
            } else if (data.data?.checkoutCreate?.checkoutUserErrors?.length > 0) {
                throw new Error(data.data.checkoutCreate.checkoutUserErrors[0].message);
            } else {
                throw new Error('Failed to create checkout');
            }
        } catch (error) {
            console.error('❌ Create checkout error:', error);
            throw error;
        }
    }
    
    // Add item to checkout
    async addToCheckout(variantId, quantity = 1) {
        // Skip for Mock.Shop
        if (this.isMockShop) {
            console.log('🛍️ Mock.Shop: addToCheckout called but not implemented');
            return null;
        }
        
        if (!this.checkout || !this.isInitialized) {
            throw new Error('Checkout not initialized');
        }
        
        const mutation = `
            mutation checkoutLineItemsAdd($checkoutId: ID!, $lineItems: [CheckoutLineItemInput!]!) {
                checkoutLineItemsAdd(checkoutId: $checkoutId, lineItems: $lineItems) {
                    checkout {
                        id
                        lineItems(first: 50) {
                            edges {
                                node {
                                    id
                                    title
                                    quantity
                                    variant {
                                        id
                                        title
                                        price
                                        image {
                                            url
                                        }
                                    }
                                }
                            }
                        }
                        subtotalPrice
                        totalPrice
                    }
                    checkoutUserErrors {
                        code
                        field
                        message
                    }
                }
            }
        `;
        
        try {
            const response = await fetch(`https://${this.domain}/api/${this.apiVersion}/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: {
                        checkoutId: this.checkout.id,
                        lineItems: [{
                            variantId: variantId,
                            quantity: quantity
                        }]
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.data?.checkoutLineItemsAdd?.checkout) {
                this.checkout = data.data.checkoutLineItemsAdd.checkout;
                this.updateCartDisplay();
                return this.checkout;
            } else if (data.data?.checkoutLineItemsAdd?.checkoutUserErrors?.length > 0) {
                throw new Error(data.data.checkoutLineItemsAdd.checkoutUserErrors[0].message);
            } else {
                throw new Error('Failed to add item to checkout');
            }
        } catch (error) {
            console.error('❌ Add to checkout error:', error);
            throw error;
        }
    }
    
    // Remove item from checkout
    async removeFromCheckout(lineItemId) {
        // Skip for Mock.Shop
        if (this.isMockShop) {
            console.log('🛍️ Mock.Shop: removeFromCheckout called but not implemented');
            return null;
        }
        
        if (!this.checkout || !this.isInitialized) {
            throw new Error('Checkout not initialized');
        }
        
        const mutation = `
            mutation checkoutLineItemsRemove($checkoutId: ID!, $lineItemIds: [ID!]!) {
                checkoutLineItemsRemove(checkoutId: $checkoutId, lineItemIds: $lineItemIds) {
                    checkout {
                        id
                        lineItems(first: 50) {
                            edges {
                                node {
                                    id
                                    title
                                    quantity
                                    variant {
                                        id
                                        title
                                        price
                                        image {
                                            url
                                        }
                                    }
                                }
                            }
                        }
                        subtotalPrice
                        totalPrice
                    }
                    checkoutUserErrors {
                        code
                        field
                        message
                    }
                }
            }
        `;
        
        try {
            const response = await fetch(`https://${this.domain}/api/${this.apiVersion}/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: {
                        checkoutId: this.checkout.id,
                        lineItemIds: [lineItemId]
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.data?.checkoutLineItemsRemove?.checkout) {
                this.checkout = data.data.checkoutLineItemsRemove.checkout;
                this.updateCartDisplay();
                return this.checkout;
            } else if (data.data?.checkoutLineItemsRemove?.checkoutUserErrors?.length > 0) {
                throw new Error(data.data.checkoutLineItemsRemove.checkoutUserErrors[0].message);
            } else {
                throw new Error('Failed to remove item from checkout');
            }
        } catch (error) {
            console.error('❌ Remove from checkout error:', error);
            throw error;
        }
    }
    
    // Update cart display
    updateCartDisplay() {
        // Skip for Mock.Shop
        if (this.isMockShop) {
            return;
        }
        
        if (!this.checkout) return;
        
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
            const itemCount = this.checkout.lineItems.edges.reduce((total, edge) => total + edge.node.quantity, 0);
            cartBadge.textContent = itemCount;
            cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
        }
    }
    
    // Get checkout URL
    getCheckoutUrl() {
        if (this.isMockShop) {
            return 'https://mock.shop/checkout';
        }
        
        return this.checkout?.webUrl || null;
    }
    
    // Check if checkout is ready
    isCheckoutReady() {
        if (this.isMockShop) {
            return true; // Mock.Shop is always "ready"
        }
        
        return this.checkout?.ready || false;
    }
}

// Initialize the client
const shopifyClient = new PureShopifyClient();

// Make available globally
window.shopifyClient = shopifyClient;

console.log('🛍️ Shopify client initialized');

