// Mock.Shop cart implementation - keeps users on site
class MockShopCart {
    constructor() {
        this.localCart = [];
        this.loadCartFromStorage();
        
        // Wait for DOM to be ready before initializing cart dropdown
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeCartDropdown();
            });
        } else {
            this.initializeCartDropdown();
        }
    }
    
    // Initialize cart dropdown functionality
    initializeCartDropdown() {
        // Create cart dropdown if it doesn't exist
        if (!document.getElementById('cartDropdown')) {
            this.createCartDropdown();
        }
        
        // Close cart when clicking outside
        document.addEventListener('click', (event) => {
            const cartIcon = document.querySelector('.cart-icon');
            const cartDropdown = document.getElementById('cartDropdown');
            
            if (cartDropdown && cartIcon && !cartIcon.contains(event.target) && !cartDropdown.contains(event.target)) {
                cartDropdown.style.display = 'none';
            }
        });
        
        // Initial cart UI update
        this.updateCartUI();
    }
    
    // Create cart dropdown HTML
    createCartDropdown() {
        const cartIcon = document.querySelector('.cart-icon');
        if (!cartIcon) {
            console.warn('Cart icon not found, cannot create dropdown');
            return;
        }
        
        const cartDropdown = document.createElement('div');
        cartDropdown.id = 'cartDropdown';
        cartDropdown.className = 'cart-dropdown';
        cartDropdown.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            min-width: 300px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        
        cartDropdown.innerHTML = `
            <div class="cart-header" style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">
                <h3 style="margin: 0; font-size: 1.1rem;">Shopping Cart</h3>
            </div>
            <div id="cartItems" class="cart-items" style="padding: 1rem;">
                <div class="empty-cart">Your cart is empty</div>
            </div>
            <div id="cartTotal" class="cart-total" style="padding: 1rem; border-top: 1px solid #e5e7eb; display: none;">
                <div class="total-amount" style="font-weight: bold; font-size: 1.1rem;"></div>
                <button onclick="cart.proceedToCheckout()" class="checkout-btn" style="
                    width: 100%; 
                    background: #10b981; 
                    color: white; 
                    border: none; 
                    padding: 0.75rem; 
                    border-radius: 6px; 
                    font-weight: 600; 
                    margin-top: 0.5rem;
                    cursor: pointer;
                ">Proceed to Checkout</button>
            </div>
        `;
        
        // Position the dropdown relative to cart icon
        cartIcon.style.position = 'relative';
        cartIcon.appendChild(cartDropdown);
        
        console.log('✅ Cart dropdown created successfully');
    }
    
    // Add to local cart (no API call - instant!)
    addToCart(productData) {
        try {
            console.log('🛒 Adding to local cart:', productData);
            
            // Validate the item
            const validatedItem = this.validateCartItem(productData);
            if (!validatedItem) {
                throw new Error('Invalid product data');
            }
            
            // Check if item already exists
            const existingIndex = this.localCart.findIndex(item => item.id === validatedItem.id);
            
            if (existingIndex >= 0) {
                // Update quantity of existing item
                this.localCart[existingIndex].quantity += validatedItem.quantity;
            } else {
                // Add new item
                this.localCart.push(validatedItem);
            }
            
            this.saveCartToStorage();
            this.updateCartUI();
            
            // User stays on your site! ✅
            this.showNotification(`Added "${validatedItem.title}" to cart!`);
            
            console.log('✅ Local cart updated:', this.localCart);
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    // Proceed to checkout - now uses the performance checkout system
    async proceedToCheckout() {
        if (this.localCart.length === 0) {
            this.showNotification('Cart is empty', 'error');
            return;
        }
        
        console.log('🚀 Starting performance checkout - staying on site!');
        console.log('📦 Transferring cart data:', this.localCart);
        
        // Check if performance checkout is available
        if (window.checkout && typeof window.checkout.proceedToCheckout === 'function') {
            // Transfer cart data to performance checkout using the new method
            window.checkout.receiveCartData(this.localCart);
            
            console.log('✅ Cart data transferred to performance checkout');
            
            // Start the performance checkout
            window.checkout.proceedToCheckout();
            
            // Hide the cart dropdown
            const cartDropdown = document.getElementById('cartDropdown');
            if (cartDropdown) {
                cartDropdown.style.display = 'none';
            }
        } else {
            console.warn('Performance checkout not available, falling back to basic checkout');
            this.showNotification('Checkout system not available', 'error');
        }
    }
    
    // Validate cart item (same as your current validation)
    validateCartItem(item) {
        if (!item || typeof item !== 'object') return null;
        
        // Validate required fields
        if (!item.id || typeof item.id !== 'string') return null;
        if (!item.title || typeof item.title !== 'string') return null;
        if (!item.price || typeof item.price !== 'number') return null;
        if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1) {
            item.quantity = 1; // Default to 1
        }
        
        return {
            id: item.id,
            title: item.title.trim(),
            price: item.price,
            quantity: item.quantity,
            image: item.image || '/placeholder.jpg'
        };
    }
    
    // Update cart quantities
    updateQuantity(itemId, newQuantity) {
        try {
            const itemIndex = this.localCart.findIndex(item => item.id === itemId);
            
            if (itemIndex >= 0) {
                if (newQuantity <= 0) {
                    // Remove item
                    this.localCart.splice(itemIndex, 1);
                    this.showNotification('Item removed from cart');
                } else {
                    // Update quantity
                    this.localCart[itemIndex].quantity = newQuantity;
                }
                
                this.saveCartToStorage();
                this.updateCartUI();
            }
        } catch (error) {
            console.error('❌ Error updating quantity:', error);
            this.showNotification('Failed to update quantity', 'error');
        }
    }
    
    // Remove item from cart
    removeItem(itemId) {
        try {
            this.localCart = this.localCart.filter(item => item.id !== itemId);
            this.saveCartToStorage();
            this.updateCartUI();
            this.showNotification('Item removed from cart');
        } catch (error) {
            console.error('❌ Error removing item:', error);
            this.showNotification('Failed to remove item', 'error');
        }
    }
    
    // Calculate totals
    calculateSubtotal() {
        return this.localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    calculateTotal() {
        const subtotal = this.calculateSubtotal();
        const tax = subtotal * 0.08; // 8% tax
        return subtotal + tax;
    }
    
    // Cart persistence
    saveCartToStorage() {
        try {
            localStorage.setItem('mockShopCart', JSON.stringify(this.localCart));
        } catch (error) {
            console.warn('Failed to save cart to storage:', error);
        }
    }
    
    loadCartFromStorage() {
        try {
            const saved = localStorage.getItem('mockShopCart');
            this.localCart = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Failed to load cart from storage:', error);
            this.localCart = [];
        }
    }
    
    // UI Updates
    updateCartUI() {
        this.updateCartBadge();
        this.updateCartModal();
    }
    
    updateCartBadge() {
        const badge = document.querySelector('.cart-badge');
        if (badge) {
            const itemCount = this.localCart.reduce((sum, item) => sum + item.quantity, 0);
            badge.textContent = itemCount;
            badge.style.display = itemCount > 0 ? 'flex' : 'none';
        }
    }
    
    updateCartModal() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems) return;
        
        if (this.localCart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            if (cartTotal) cartTotal.style.display = 'none';
        } else {
            const itemsHTML = this.localCart.map(item => `
                <div class="cart-item" style="
                    display: flex; 
                    align-items: center; 
                    padding: 0.5rem 0; 
                    border-bottom: 1px solid #f3f4f6;
                ">
                    <div class="item-info" style="flex: 1;">
                        <div class="item-name" style="font-weight: 600; margin-bottom: 0.25rem;">${item.title}</div>
                        <div class="item-price" style="color: #6b7280;">$${item.price.toFixed(2)}</div>
                    </div>
                    <div class="quantity-controls" style="
                        display: flex; 
                        align-items: center; 
                        gap: 0.5rem; 
                        margin: 0 1rem;
                    ">
                        <button class="qty-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})" style="
                            background: #f3f4f6; 
                            border: none; 
                            width: 24px; 
                            height: 24px; 
                            border-radius: 4px; 
                            cursor: pointer;
                        ">-</button>
                        <span class="quantity" style="min-width: 20px; text-align: center;">${item.quantity}</span>
                        <button class="qty-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})" style="
                            background: #f3f4f6; 
                            border: none; 
                            width: 24px; 
                            height: 24px; 
                            border-radius: 4px; 
                            cursor: pointer;
                        ">+</button>
                    </div>
                    <button class="remove-item" onclick="cart.removeItem('${item.id}')" style="
                        background: #ef4444; 
                        color: white; 
                        border: none; 
                        width: 24px; 
                        height: 24px; 
                        border-radius: 4px; 
                        cursor: pointer; 
                        font-size: 1.2rem;
                    ">×</button>
                </div>
            `).join('');
            
            cartItems.innerHTML = itemsHTML;
            
            if (cartTotal) {
                cartTotal.style.display = 'block';
                const totalElement = cartTotal.querySelector('.total-amount');
                if (totalElement) {
                    totalElement.textContent = `Total: $${this.calculateTotal().toFixed(2)}`;
                }
            }
        }
    }
    
    showNotification(message, type = 'success') {
        try {
            const notification = document.createElement('div');
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px;
                background: ${type === 'error' ? '#e53e3e' : '#48bb78'};
                color: white; padding: 1rem 1.5rem;
                border-radius: 8px; z-index: 1001;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => notification.style.transform = 'translateX(0)', 100);
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        } catch (error) {
            console.error('Failed to show notification:', error);
            // Fallback to alert if notification fails
            alert(message);
        }
    }
}

// Initialize the cart
const cart = new MockShopCart();

// Global functions for your UI
function addToCart(productData) {
    try {
        // Handle both object format and individual parameters
        let formattedProduct;
        
        if (typeof productData === 'object' && productData !== null) {
            // Object format: {id, title, price, image, quantity}
            formattedProduct = productData;
        } else {
            // Individual parameters: addToCart(id, title, price, image, quantity)
            const args = Array.from(arguments);
            formattedProduct = {
                id: args[0],
                title: args[1],
                price: args[2],
                image: args[3],
                quantity: args[4] || 1
            };
        }
        
        console.log('🛒 Adding to cart (formatted):', formattedProduct);
        cart.addToCart(formattedProduct);
    } catch (error) {
        cart.showNotification(error.message, 'error');
    }
}

// Remove the duplicate proceedToCheckout function - let the cart handle it
// function proceedToCheckout() {
//     try {
//         await cart.proceedToCheckout();
//     } catch (error) {
//         cart.showNotification(error.message, 'error');
//     }
// }

function toggleCart() {
    const modal = document.getElementById('cartDropdown');
    if (modal) {
        modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
    }
}

// Add the missing toggleCartDropdown function
function toggleCartDropdown() {
    try {
        const cartDropdown = document.getElementById('cartDropdown');
        if (cartDropdown) {
            const isVisible = cartDropdown.style.display === 'block';
            cartDropdown.style.display = isVisible ? 'none' : 'block';
        } else {
            console.warn('Cart dropdown not found, attempting to create it');
            cart.initializeCartDropdown();
        }
    } catch (error) {
        console.error('Error toggling cart dropdown:', error);
    }
}

// Make cart available globally
window.cart = cart;
window.toggleCartDropdown = toggleCartDropdown;

console.log('🛒 Mock.Shop cart system initialized - integrated with performance checkout');
