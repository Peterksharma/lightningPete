// Security utilities for the e-commerce system
class SecurityManager {
    constructor() {
        this.csrfToken = this.generateCSRFToken();
        this.rateLimitStore = new Map();
        this.RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
        this.RATE_LIMIT_MAX = 10; // 10 requests per minute
    }

    // Generate CSRF token for this session
    generateCSRFToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const payload = `${timestamp}:${random}`;
        return btoa(payload);
    }

    // Validate CSRF token
    validateCSRFToken(token, maxAge = 3600000) { // 1 hour default
        try {
            const payload = atob(token);
            const [timestamp, random] = payload.split(':');
            
            const tokenAge = Date.now() - parseInt(timestamp);
            
            if (tokenAge > maxAge) {
                this.logSecurityEvent('CSRF_TOKEN_EXPIRED', { tokenAge, maxAge });
                return false;
            }
            
            return true;
        } catch (error) {
            this.logSecurityEvent('CSRF_TOKEN_INVALID', { error: error.message });
            return false;
        }
    }

    // Rate limiting for cart operations
    checkRateLimit(operation = 'cart') {
        const now = Date.now();
        const windowStart = now - this.RATE_LIMIT_WINDOW;
        const key = `${operation}-${now}`;
        
        // Clean old entries
        for (const [key, timestamp] of this.rateLimitStore.entries()) {
            if (timestamp < windowStart) {
                this.rateLimitStore.delete(key);
            }
        }
        
        // Count requests in current window
        const requestsInWindow = Array.from(this.rateLimitStore.entries())
            .filter(([key, timestamp]) => key.startsWith(operation) && timestamp >= windowStart)
            .length;
        
        if (requestsInWindow >= this.RATE_LIMIT_MAX) {
            this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { operation, requestsInWindow });
            return false;
        }
        
        // Record this request
        this.rateLimitStore.set(key, now);
        return true;
    }

    // Cart item validation
    validateCartItem(item) {
        const validatedItem = {
            id: null,
            title: null,
            price: null,
            image: null,
            quantity: null
        };
        
        // Product ID validation (Shopify format)
        if (typeof item.id === 'string' && /^gid:\/\/shopify\/Product\/\d+$/.test(item.id)) {
            validatedItem.id = item.id;
        } else {
            this.logSecurityEvent('INVALID_PRODUCT_ID', { id: item.id });
            return null;
        }
        
        // Title validation (alphanumeric, spaces, basic punctuation)
        if (typeof item.title === 'string' && /^[a-zA-Z0-9\s\-_.,!?()]{1,100}$/.test(item.title)) {
            validatedItem.title = item.title;
        } else {
            this.logSecurityEvent('INVALID_PRODUCT_TITLE', { title: item.title });
            return null;
        }
        
        // Price validation (positive number, reasonable range)
        if (typeof item.price === 'number' && item.price > 0 && item.price < 10000) {
            validatedItem.price = item.price;
        } else {
            this.logSecurityEvent('INVALID_PRODUCT_PRICE', { price: item.price });
            return null;
        }
        
        // Image URL validation (HTTPS only, Shopify domain)
        if (typeof item.image === 'string' && 
            item.image.startsWith('https://') && 
            (item.image.includes('cdn.shopify.com') || item.image.includes('shopify.com'))) {
            validatedItem.image = item.image;
        } else {
            this.logSecurityEvent('INVALID_PRODUCT_IMAGE', { image: item.image });
            return null;
        }
        
        // Quantity validation (1-10 items max per product)
        if (Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 10) {
            validatedItem.quantity = item.quantity;
        } else {
            this.logSecurityEvent('INVALID_PRODUCT_QUANTITY', { quantity: item.quantity });
            return null;
        }
        
        // Only return if all required fields are valid
        return validatedItem.id && validatedItem.title && validatedItem.price && 
               validatedItem.image && validatedItem.quantity ? validatedItem : null;
    }

    // Cart validation
    validateCart(cartItems) {
        if (!Array.isArray(cartItems)) {
            this.logSecurityEvent('INVALID_CART_FORMAT', { type: typeof cartItems });
            throw new Error('Cart must be an array');
        }
        
        if (cartItems.length === 0) {
            this.logSecurityEvent('EMPTY_CART_ATTEMPT', {});
            throw new Error('Cart cannot be empty');
        }
        
        if (cartItems.length > 50) {
            this.logSecurityEvent('CART_TOO_LARGE', { size: cartItems.length });
            throw new Error('Too many items in cart');
        }
        
        const validatedItems = cartItems
            .map(item => this.validateCartItem(item))
            .filter(Boolean);
        
        if (validatedItems.length !== cartItems.length) {
            this.logSecurityEvent('INVALID_ITEMS_IN_CART', { 
                original: cartItems.length, 
                validated: validatedItems.length 
            });
            throw new Error('Invalid items detected in cart');
        }
        
        return validatedItems;
    }

    // Security event logging
    logSecurityEvent(event, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            details,
            severity: this.getSeverity(event),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Log to console (in production, send to external service)
        console.warn('SECURITY_EVENT:', JSON.stringify(logEntry));
        
        // Store in localStorage for debugging (remove in production)
        this.storeSecurityLog(logEntry);
        
        // Alert on high-severity events
        if (logEntry.severity === 'HIGH') {
            this.sendSecurityAlert(logEntry);
        }
    }

    // Get event severity
    getSeverity(event) {
        const highSeverityEvents = [
            'CSRF_TOKEN_INVALID',
            'CSRF_TOKEN_EXPIRED',
            'RATE_LIMIT_EXCEEDED',
            'INVALID_PRODUCT_ID',
            'INVALID_PRODUCT_PRICE'
        ];
        
        return highSeverityEvents.includes(event) ? 'HIGH' : 'MEDIUM';
    }

    // Store security log (for debugging - remove in production)
    storeSecurityLog(logEntry) {
        try {
            const logs = JSON.parse(localStorage.getItem('security-logs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 100 logs
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            
            localStorage.setItem('security-logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to store security log:', error);
        }
    }

    // Send security alert (placeholder - implement in production)
    sendSecurityAlert(logEntry) {
        // In production, send to monitoring service
        console.error('🚨 HIGH SEVERITY SECURITY EVENT:', logEntry);
        
        // Could send to:
        // - Email service
        // - Slack webhook
        // - Security monitoring service
        // - Log aggregation service
    }

    // Sanitize HTML content
    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Validate and sanitize user input
    sanitizeInput(input, type = 'text') {
        if (typeof input !== 'string') {
            return '';
        }
        
        switch (type) {
            case 'text':
                return this.sanitizeHTML(input.trim().substring(0, 100));
            case 'email':
                return input.trim().toLowerCase().substring(0, 100);
            case 'number':
                const num = parseFloat(input);
                return isNaN(num) ? 0 : Math.max(0, Math.min(num, 999999));
            default:
                return this.sanitizeHTML(input.trim());
        }
    }
}

// Export for use in other modules
window.SecurityManager = SecurityManager;
