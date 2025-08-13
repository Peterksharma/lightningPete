/**
 * Pure JavaScript Shopify Storefront Client
 * No external packages required - uses native fetch API
 * Safe to include in your static site
 */

class PureShopifyClient {
    constructor() {
        // ✅ Public token - safe to expose
        this.domain = window.SHOPIFY_CONFIG?.domain || 'your-shop.myshopify.com';
        this.storefrontAccessToken = window.SHOPIFY_CONFIG?.storefrontAccessToken || 'your-storefront-access-token-here';
        this.apiVersion = window.SHOPIFY_CONFIG?.apiVersion || '2024-01';
        this.checkout = null;
        this.isInitialized = false;
        this.init();
    }
    
    async init() {
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
    
    // Add product to checkout
    async addProduct(variantId, quantity = 1) {
        if (!this.isInitialized || !this.checkout) {
            console.warn('Shopify not initialized, using local cart fallback');
            return false;
        }
        
        const mutation = `
            mutation checkoutAddLineItems($checkoutId: ID!, $lineItems: [CheckoutLineItemInput!]!) {
                checkoutAddLineItems(checkoutId: $checkoutId, lineItems: $lineItems) {
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
                        checkoutId: this.checkout.id,
                        lineItems: [
                            {
                                variantId: variantId,
                                quantity: quantity
                            }
                        ]
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.data?.checkoutAddLineItems?.checkout) {
                this.checkout = data.data.checkoutAddLineItems.checkout;
                this.updateCartDisplay();
                console.log('✅ Product added to Shopify checkout');
                return true;
            } else if (data.data?.checkoutAddLineItems?.checkoutUserErrors?.length > 0) {
                throw new Error(data.data.checkoutAddLineItems.checkoutUserErrors[0].message);
            } else {
                throw new Error('Failed to add product');
            }
        } catch (error) {
            console.error('❌ Add product error:', error);
            return false;
        }
    }
    
    // Remove product from checkout
    async removeProduct(lineItemId) {
        if (!this.isInitialized || !this.checkout) {
            return false;
        }
        
        const mutation = `
            mutation checkoutRemoveLineItems($checkoutId: ID!, $lineItemIds: [ID!]!) {
                checkoutRemoveLineItems(checkoutId: $checkoutId, lineItemIds: $lineItemIds) {
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
                        checkoutId: this.checkout.id,
                        lineItemIds: [lineItemId]
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.data?.checkoutRemoveLineItems?.checkout) {
                this.checkout = data.data.checkoutRemoveLineItems.checkout;
                this.updateCartDisplay();
                console.log('✅ Product removed from Shopify checkout');
                return true;
            } else if (data.data?.checkoutRemoveLineItems?.checkoutUserErrors?.length > 0) {
                throw new Error(data.data.checkoutRemoveLineItems.checkoutUserErrors[0].message);
            } else {
                throw new Error('Failed to remove product');
            }
        } catch (error) {
            console.error('❌ Remove product error:', error);
            return false;
        }
    }
    
    // Update product quantity
    async updateProductQuantity(lineItemId, quantity) {
        if (!this.isInitialized || !this.checkout) {
            return false;
        }
        
        if (quantity <= 0) {
            return await this.removeProduct(lineItemId);
        }
        
        const mutation = `
            mutation checkoutUpdateLineItems($checkoutId: ID!, $lineItems: [CheckoutLineItemUpdateInput!]!) {
                checkoutUpdateLineItems(checkoutId: $checkoutId, lineItems: $lineItems) {
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
            const response = await fetch(`https://${this.domain}/api/2024-01/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: {
                        checkoutId: this.checkout.id,
                        lineItems: [
                            {
                                id: lineItemId,
                                quantity: quantity
                            }
                        ]
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.data?.checkoutUpdateLineItems?.checkout) {
                this.checkout = data.data.checkoutUpdateLineItems.checkout;
                this.updateCartDisplay();
                console.log('✅ Product quantity updated in Shopify checkout');
                return true;
            } else if (data.data?.checkoutUpdateLineItems?.checkoutUserErrors?.length > 0) {
                throw new Error(data.data.checkoutUpdateLineItems.checkoutUserErrors[0].message);
            } else {
                throw new Error('Failed to update product quantity');
            }
        } catch (error) {
            console.error('❌ Update quantity error:', error);
            return false;
        }
    }
    
    // Proceed to checkout
    async proceedToCheckout() {
        if (!this.isInitialized || !this.checkout) {
            console.warn('Shopify not initialized, cannot proceed to checkout');
            return false;
        }
        
        if (this.getLineItems().length > 0) {
            try {
                // Redirect to Shopify's secure checkout
                window.location.href = this.checkout.webUrl;
                return true;
            } catch (error) {
                console.error('❌ Failed to redirect to checkout:', error);
                return false;
            }
        } else {
            console.warn('Cart is empty, cannot proceed to checkout');
            return false;
        }
    }
    
    // Helper to get line items array
    getLineItems() {
        if (!this.checkout?.lineItems?.edges) return [];
        return this.checkout.lineItems.edges.map(edge => edge.node);
    }
    
    // Update cart display
    updateCartDisplay() {
        if (!this.checkout) return;
        
        const lineItems = this.getLineItems();
        const itemCount = lineItems.reduce((total, item) => total + item.quantity, 0);
        
        // Update cart badge
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
            cartBadge.textContent = itemCount;
            cartBadge.style.display = itemCount > 0 ? 'block' : 'none';
        }
        
        // Update cart items display
        this.renderShopifyCartItems();
    }
    
    // Render cart items
    renderShopifyCartItems() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems || !this.checkout) return;
        
        const lineItems = this.getLineItems();
        
        if (lineItems.length === 0) {
            cartItems.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
            return;
        }
        
        const total = this.checkout.totalPrice;
        
        cartItems.innerHTML = `
            ${lineItems.map(item => `
                <div class="cart-item" data-line-item-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.variant.image?.url || '/placeholder-image.jpg'}" alt="${item.title}" loading="lazy">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.title}</h4>
                        <div class="cart-item-price">$${item.variant.price}</div>
                        <div class="cart-item-quantity">
                            <button onclick="event.stopPropagation(); window.shopify.updateProductQuantity('${item.id}', ${item.quantity - 1})" class="qty-btn">-</button>
                            <span class="qty-number">${item.quantity}</span>
                            <button onclick="event.stopPropagation(); window.shopify.updateProductQuantity('${item.id}', ${item.quantity + 1})" class="qty-btn">+</button>
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); window.shopify.removeProduct('${item.id}')" class="remove-item-btn" aria-label="Remove item">×</button>
                </div>
            `).join('')}
            <div class="cart-total">
                <strong>Total: $${total}</strong>
            </div>
        `;
    }
    
    // Get cart summary
    getCartSummary() {
        if (!this.checkout) return { items: [], total: 0, itemCount: 0 };
        
        const lineItems = this.getLineItems();
        
        return {
            items: lineItems,
            subtotal: this.checkout.subtotalPrice,
            total: this.checkout.totalPrice,
            itemCount: lineItems.reduce((total, item) => total + item.quantity, 0)
        };
    }
    
    // Check if Shopify is available
    isAvailable() {
        return this.isInitialized && this.checkout !== null;
    }
    
    // Get checkout status
    getCheckoutStatus() {
        if (!this.checkout) return 'not_initialized';
        
        const lineItems = this.getLineItems();
        if (lineItems.length === 0) return 'empty';
        if (this.checkout.ready) return 'ready';
        return 'processing';
    }
    
    // Test connection to Shopify
    async testConnection() {
        try {
            const response = await fetch(`https://${this.domain}/api/2024-01/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
                },
                body: JSON.stringify({
                    query: '{ shop { name } }'
                })
            });
            
            const data = await response.json();
            return data.data?.shop?.name ? true : false;
        } catch (error) {
            console.error('❌ Shopify connection test failed:', error);
            return false;
        }
    }
}

// Initialize globally
window.shopify = new PureShopifyClient();

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PureShopifyClient;
}
