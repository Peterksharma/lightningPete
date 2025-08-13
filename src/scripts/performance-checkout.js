/**
 * Performance Checkout System
 * Custom checkout that NEVER leaves your site - better UX and conversion rates
 */

// Prevent duplicate initialization
if (window.checkout) {
    console.log('🔄 Performance checkout already initialized, skipping...');
} else {
    class PerformanceCheckout {
        constructor() {
            this.localCart = [];
            this.checkoutStep = 'cart'; // cart → info → payment → confirmation
            this.customerInfo = {};
            this.loadCartFromStorage();
        }
        
        // Proceed to checkout
        async proceedToCheckout() {
            console.log('🛒 Performance checkout - cart data:', this.localCart);
            console.log('📦 Items in cart:', this.localCart.length);
            
            if (this.localCart.length === 0) {
                this.showNotification('Cart is empty', 'error');
                return;
            }
            
            this.showCustomCheckoutModal();
        }
        
        // Method to receive cart data from mock cart
        receiveCartData(cartData) {
            console.log('📥 Receiving cart data from mock cart:', cartData);
            this.localCart = Array.isArray(cartData) ? [...cartData] : [];
            this.saveCartToStorage();
            console.log('✅ Cart data received and saved:', this.localCart);
        }
        
        showCustomCheckoutModal() {
            // Check if modal already exists
            if (document.getElementById('customCheckoutModal')) {
                console.log('🔄 Checkout modal already exists, showing existing one');
                const existingModal = document.getElementById('customCheckoutModal');
                existingModal.style.display = 'flex';
                // Refresh the cart data display
                this.refreshCheckoutCartDisplay();
                return;
            }
            
            console.log('🆕 Creating new checkout modal with cart data:', this.localCart);
            
            // Create checkout modal HTML
            const checkoutModal = document.createElement('div');
            checkoutModal.id = 'customCheckoutModal';
            checkoutModal.className = 'checkout-modal active';
            checkoutModal.innerHTML = this.getCheckoutHTML();
            
            document.body.appendChild(checkoutModal);
            
            // Initialize checkout interactions
            this.initializeCheckoutHandlers();
            
            // Start with cart review step
            this.showCheckoutStep('cart');
            
            // Populate cart data immediately after DOM insertion
            this.refreshCheckoutCartDisplay();
        }
        
        // Add method to refresh cart display
        refreshCheckoutCartDisplay() {
            console.log('🔄 Starting cart display refresh...');
            console.log('📦 Current cart data:', this.localCart);
            
            const cartItemsContainer = document.getElementById('checkoutCartItems');
            console.log('🎯 Cart items container found:', !!cartItemsContainer);
            
            if (cartItemsContainer) {
                const renderedHTML = this.renderCartItems();
                console.log('🎨 Rendered HTML:', renderedHTML);
                cartItemsContainer.innerHTML = renderedHTML;
            } else {
                console.warn('❌ Cart items container not found!');
            }
            
            // Update totals
            const subtotalElement = document.querySelector('.checkout-totals .subtotal');
            const taxElement = document.querySelector('.checkout-totals .tax');
            const totalElement = document.querySelector('.checkout-totals .total');
            
            const subtotal = this.calculateSubtotal();
            const tax = subtotal * 0.08;
            const total = this.calculateTotal();
            
            console.log('💰 Calculations - Subtotal:', subtotal, 'Tax:', tax, 'Total:', total);
            
            if (subtotalElement) {
                subtotalElement.textContent = `Subtotal: $${subtotal.toFixed(2)}`;
                console.log('✅ Updated subtotal element');
            }
            if (taxElement) {
                taxElement.textContent = `Tax: $${tax.toFixed(2)}`;
                console.log('✅ Updated tax element');
            }
            if (totalElement) {
                totalElement.textContent = `Total: $${total.toFixed(2)}`;
                console.log('✅ Updated total element');
            }
            
            console.log('🔄 Finished cart display refresh with', this.localCart.length, 'items');
        }
        
        getCheckoutHTML() {
            return `
                <div class="checkout-overlay">
                    <div class="checkout-container">
                        <div class="checkout-header">
                            <h2>Secure Checkout</h2>
                            <button class="close-checkout" onclick="checkout.closeCustomCheckout()">×</button>
                        </div>
                        
                        <!-- Progress indicator -->
                        <div class="checkout-progress">
                            <div class="step" data-step="cart">
                                <span class="step-number">1</span>
                                <span class="step-label">Cart</span>
                            </div>
                            <div class="step" data-step="info">
                                <span class="step-number">2</span>
                                <span class="step-label">Information</span>
                            </div>
                            <div class="step" data-step="payment">
                                <span class="step-number">3</span>
                                <span class="step-label">Payment</span>
                            </div>
                            <div class="step" data-step="confirmation">
                                <span class="step-number">4</span>
                                <span class="step-label">Complete</span>
                            </div>
                        </div>
                        
                        <!-- Cart Review Step -->
                        <div class="checkout-step" data-step="cart">
                            <h3>Review Your Order</h3>
                            <div class="checkout-cart-items" id="checkoutCartItems">
                                <!-- Cart items will be populated here -->
                            </div>
                            <div class="checkout-totals">
                                <div class="subtotal">Subtotal: $0.00</div>
                                <div class="tax">Tax: $0.00</div>
                                <div class="total">Total: $0.00</div>
                            </div>
                            <button class="checkout-next-btn" onclick="checkout.nextStep()">
                                Continue to Information
                            </button>
                        </div>
                        
                        <!-- Customer Information Step -->
                        <div class="checkout-step" data-step="info" style="display: none;">
                            <h3>Shipping Information</h3>
                            <form class="checkout-form" id="customerInfoForm">
                                <div class="form-row">
                                    <input type="email" name="email" placeholder="Email" required>
                                </div>
                                <div class="form-row">
                                    <input type="text" name="firstName" placeholder="First Name" required>
                                    <input type="text" name="lastName" placeholder="Last Name" required>
                                </div>
                                <div class="form-row">
                                    <input type="text" name="address" placeholder="Address" required>
                                </div>
                                <div class="form-row">
                                    <input type="text" name="city" placeholder="City" required>
                                    <input type="text" name="state" placeholder="State" required>
                                    <input type="text" name="zip" placeholder="ZIP Code" required>
                                </div>
                                <div class="form-row">
                                    <select name="country" required>
                                        <option value="">Select Country</option>
                                        <option value="US">United States</option>
                                        <option value="CA">Canada</option>
                                        <option value="GB">United Kingdom</option>
                                    </select>
                                </div>
                            </form>
                            <div class="checkout-buttons">
                                <button class="checkout-back-btn" onclick="checkout.previousStep()">
                                    Back to Cart
                                </button>
                                <button class="checkout-next-btn" onclick="checkout.nextStep()">
                                    Continue to Payment
                                </button>
                            </div>
                        </div>
                        
                        <!-- Payment Step -->
                        <div class="checkout-step" data-step="payment" style="display: none;">
                            <h3>Payment Information</h3>
                            <div class="payment-methods">
                                <label class="payment-method">
                                    <input type="radio" name="paymentMethod" value="card" checked>
                                    <span>Credit Card</span>
                                </label>
                                <label class="payment-method">
                                    <input type="radio" name="paymentMethod" value="paypal">
                                    <span>PayPal</span>
                                </label>
                            </div>
                            
                            <div class="payment-form" id="cardPaymentForm">
                                <div class="form-row">
                                    <input type="text" name="cardNumber" placeholder="Card Number" required>
                                </div>
                                <div class="form-row">
                                    <input type="text" name="expiry" placeholder="MM/YY" required>
                                    <input type="text" name="cvv" placeholder="CVV" required>
                                </div>
                                <div class="form-row">
                                    <input type="text" name="cardholderName" placeholder="Cardholder Name" required>
                                </div>
                            </div>
                            
                            <div class="order-summary">
                                <h4>Order Summary</h4>
                                <div class="summary-line">
                                    <span>Items (${this.getItemCount()})</span>
                                    <span>$${this.calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div class="summary-line">
                                    <span>Shipping</span>
                                    <span>Free</span>
                                </div>
                                <div class="summary-line">
                                    <span>Tax</span>
                                    <span>$${(this.calculateSubtotal() * 0.08).toFixed(2)}</span>
                                </div>
                                <div class="summary-total">
                                    <span>Total</span>
                                    <span>$${this.calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div class="checkout-buttons">
                                <button class="checkout-back-btn" onclick="checkout.previousStep()">
                                    Back to Information
                                </button>
                                <button class="checkout-complete-btn" onclick="checkout.completeOrder()">
                                    Complete Order
                                </button>
                            </div>
                        </div>
                        
                        <!-- Confirmation Step -->
                        <div class="checkout-step" data-step="confirmation" style="display: none;">
                            <div class="order-confirmation">
                                <div class="confirmation-icon">✅</div>
                                <h3>Order Confirmed!</h3>
                                <p>Thank you for your purchase. Your order has been placed successfully.</p>
                                <div class="order-details" id="orderDetails">
                                    <!-- Order details will be populated here -->
                                </div>
                                <button class="continue-shopping-btn" onclick="checkout.continueShopping()">
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Step navigation
        nextStep() {
            switch(this.checkoutStep) {
                case 'cart':
                    this.checkoutStep = 'info';
                    break;
                case 'info':
                    if (this.validateCustomerInfo()) {
                        this.checkoutStep = 'payment';
                    } else {
                        return; // Don't proceed if validation fails
                    }
                    break;
                case 'payment':
                    // Payment step handled by completeOrder()
                    return;
            }
            
            this.showCheckoutStep(this.checkoutStep);
        }
        
        previousStep() {
            switch(this.checkoutStep) {
                case 'info':
                    this.checkoutStep = 'cart';
                    break;
                case 'payment':
                    this.checkoutStep = 'info';
                    break;
            }
            
            this.showCheckoutStep(this.checkoutStep);
        }
        
        showCheckoutStep(step) {
            // Hide all steps
            document.querySelectorAll('.checkout-step').forEach(el => {
                el.style.display = 'none';
            });
            
            // Show current step
            const currentStep = document.querySelector(`[data-step="${step}"]`);
            if (currentStep) {
                currentStep.style.display = 'block';
            }
            
            // Update progress indicator
            document.querySelectorAll('.checkout-progress .step').forEach(el => {
                el.classList.remove('active', 'completed');
            });
            
            document.querySelectorAll('.checkout-progress .step').forEach((el, index) => {
                const stepName = el.getAttribute('data-step');
                const stepOrder = ['cart', 'info', 'payment', 'confirmation'];
                const currentIndex = stepOrder.indexOf(step);
                const elIndex = stepOrder.indexOf(stepName);
                
                if (elIndex < currentIndex) {
                    el.classList.add('completed');
                } else if (elIndex === currentIndex) {
                    el.classList.add('active');
                }
            });
        }
        
        validateCustomerInfo() {
            const form = document.getElementById('customerInfoForm');
            const formData = new FormData(form);
            
            // Basic validation
            const required = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zip', 'country'];
            
            for (const field of required) {
                if (!formData.get(field)) {
                    this.showNotification(`${field} is required`, 'error');
                    return false;
                }
            }
            
            // Save customer info
            this.customerInfo = Object.fromEntries(formData);
            return true;
        }
        
        async completeOrder() {
            console.log('🎉 Completing order on YOUR site!');
            
            // Show loading state
            const completeBtn = document.querySelector('.checkout-complete-btn');
            completeBtn.textContent = 'Processing...';
            completeBtn.disabled = true;
            
            try {
                // In a real implementation, you'd:
                // 1. Create Shopify order via API
                // 2. Process payment via Stripe/PayPal
                // 3. Send confirmation email
                
                // For now, simulate the process
                await this.simulateOrderProcessing();
                
                // Show confirmation step
                this.checkoutStep = 'confirmation';
                this.showCheckoutStep('confirmation');
                this.populateOrderConfirmation();
                
                // Clear cart
                this.localCart = [];
                this.saveCartToStorage();
                this.updateCartUI();
                
            } catch (error) {
                console.error('Order failed:', error);
                this.showNotification('Order failed. Please try again.', 'error');
                
                completeBtn.textContent = 'Complete Order';
                completeBtn.disabled = false;
            }
        }
        
        async simulateOrderProcessing() {
            // Simulate API calls
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Create order data
            this.orderData = {
                orderNumber: '#' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                date: new Date().toLocaleDateString(),
                items: [...this.localCart],
                customer: this.customerInfo,
                total: this.calculateTotal()
            };
        }
        
        populateOrderConfirmation() {
            const orderDetails = document.getElementById('orderDetails');
            orderDetails.innerHTML = `
                <div class="order-number">Order ${this.orderData.orderNumber}</div>
                <div class="order-date">Placed on ${this.orderData.date}</div>
                <div class="order-email">Confirmation sent to ${this.customerInfo.email}</div>
            `;
        }
        
        continueShopping() {
            this.closeCustomCheckout();
        }
        
        closeCustomCheckout() {
            const modal = document.getElementById('customCheckoutModal');
            if (modal) {
                modal.remove();
            }
            this.checkoutStep = 'cart';
        }
        
        // Utility methods
        renderCartItems() {
            return this.localCart.map(item => `
                <div class="checkout-cart-item">
                    <img src="${item.image}" alt="${item.title}" class="item-image">
                    <div class="item-details">
                        <div class="item-name">${item.title}</div>
                        <div class="item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
                    </div>
                    <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `).join('');
        }
        
        getItemCount() {
            return this.localCart.reduce((sum, item) => sum + item.quantity, 0);
        }
        
        calculateSubtotal() {
            return this.localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }
        
        calculateTotal() {
            const subtotal = this.calculateSubtotal();
            const tax = subtotal * 0.08;
            return subtotal + tax;
        }
        
        initializeCheckoutHandlers() {
            // Close modal when clicking outside
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('checkout-overlay')) {
                    this.closeCustomCheckout();
                }
            });
            
            // Payment method switching
            document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    // Handle payment method changes
                    console.log('Payment method:', e.target.value);
                });
            });
        }
        
        // Notification system
        showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px;
                background: ${type === 'error' ? '#e53e3e' : '#48bb78'};
                color: white; padding: 1rem 1.5rem;
                border-radius: 8px; z-index: 10001;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => notification.style.transform = 'translateX(0)', 100);
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        // Cart management (same as before)
        addToCart(productData) {
            // This method is not needed - cart management is handled by MockShopCart
            console.log('🛒 Performance checkout received addToCart call - delegating to mock cart');
            // Don't add to performance checkout cart - let the mock cart handle it
        }
        
        validateCartItem(item) {
            // This method is not needed - cart management is handled by MockShopCart
            return null;
        }
        
        saveCartToStorage() {
            // This method is not needed - cart management is handled by MockShopCart
        }
        
        loadCartFromStorage() {
            // This method is not needed - cart management is handled by MockShopCart
        }
        
        updateCartUI() {
            // This method is not needed - cart management is handled by MockShopCart
        }
    }

    // Initialize the performance checkout
    const checkout = new PerformanceCheckout();

    // Make checkout available globally
    window.checkout = checkout;

    console.log('🚀 Performance checkout initialized - users stay on your site!');
}
