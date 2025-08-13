/**
 * Security Manager Tests
 * Tests all security features including validation, rate limiting, and CSRF protection
 */

// Import the SecurityManager class
// Note: In a real environment, you'd import this from a module
// For testing, we'll create a mock version that matches the browser implementation

describe('SecurityManager', () => {
  let securityManager;
  
  beforeEach(() => {
    global.resetMocks();
    // Create a new SecurityManager instance for each test
    securityManager = new SecurityManager();
  });

  describe('CSRF Token Management', () => {
    test('should generate valid CSRF token', () => {
      const token = securityManager.generateCSRFToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('should validate valid CSRF token', () => {
      const token = securityManager.generateCSRFToken();
      const isValid = securityManager.validateCSRFToken(token);
      expect(isValid).toBe(true);
    });

    test('should reject invalid CSRF token', () => {
      const isValid = securityManager.validateCSRFToken('invalid-token');
      expect(isValid).toBe(false);
    });

    test('should reject expired CSRF token', () => {
      // Create a token that's older than 1 hour
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      const oldToken = btoa(`${oldTimestamp}:random`);
      
      const isValid = securityManager.validateCSRFToken(oldToken);
      expect(isValid).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', () => {
      // Make 9 requests (under the 10 per minute limit)
      for (let i = 0; i < 9; i++) {
        const allowed = securityManager.checkRateLimit('test-operation');
        expect(allowed).toBe(true);
      }
    });

    test('should block requests exceeding rate limit', () => {
      // Make 10 requests to hit the limit
      for (let i = 0; i < 10; i++) {
        securityManager.checkRateLimit('test-operation');
      }
      
      // 11th request should be blocked
      const allowed = securityManager.checkRateLimit('test-operation');
      expect(allowed).toBe(false);
    });

    test('should reset rate limit after window expires', () => {
      // Make 10 requests to hit the limit
      for (let i = 0; i < 10; i++) {
        securityManager.checkRateLimit('test-operation');
      }
      
      // Mock time to advance past the rate limit window
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 70000); // 70 seconds later
      
      // Should allow requests again
      const allowed = securityManager.checkRateLimit('test-operation');
      expect(allowed).toBe(true);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });

    test('should handle different operation types separately', () => {
      // Fill up one operation type
      for (let i = 0; i < 10; i++) {
        securityManager.checkRateLimit('operation-a');
      }
      
      // Other operation types should still work
      const allowed = securityManager.checkRateLimit('operation-b');
      expect(allowed).toBe(true);
    });
  });

  describe('Cart Item Validation', () => {
    test('should validate valid cart item', () => {
      const validItem = global.createMockCartItem();
      const validated = securityManager.validateCartItem(validItem);
      
      expect(validated).toBeDefined();
      expect(validated.id).toBe(validItem.id);
      expect(validated.title).toBe(validItem.title);
      expect(validated.price).toBe(validItem.price);
      expect(validated.image).toBe(validItem.image);
      expect(validated.quantity).toBe(validItem.quantity);
    });

    test('should reject invalid product ID', () => {
      const invalidItem = global.createMockCartItem({
        id: 'invalid-id'
      });
      
      const validated = securityManager.validateCartItem(invalidItem);
      expect(validated).toBeNull();
    });

    test('should reject invalid product title', () => {
      const invalidItem = global.createMockCartItem({
        title: '<script>alert("xss")</script>'
      });
      
      const validated = securityManager.validateCartItem(invalidItem);
      expect(validated).toBeNull();
    });

    test('should reject invalid price', () => {
      const invalidItem = global.createMockCartItem({
        price: -10
      });
      
      const validated = securityManager.validateCartItem(invalidItem);
      expect(validated).toBeNull();
    });

    test('should reject invalid image URL', () => {
      const invalidItem = global.createMockCartItem({
        image: 'javascript:alert("xss")'
      });
      
      const validated = securityManager.validateCartItem(invalidItem);
      expect(validated).toBeNull();
    });

    test('should reject invalid quantity', () => {
      const invalidItem = global.createMockCartItem({
        quantity: 11
      });
      
      const validated = securityManager.validateCartItem(invalidItem);
      expect(validated).toBeNull();
    });

    test('should reject zero quantity', () => {
      const invalidItem = global.createMockCartItem({
        quantity: 0
      });
      
      const validated = securityManager.validateCartItem(invalidItem);
      expect(validated).toBeNull();
    });

    test('should reject negative quantity', () => {
      const invalidItem = global.createMockCartItem({
        quantity: -1
      });
      
      const validated = securityManager.validateCartItem(invalidItem);
      expect(validated).toBeNull();
    });
  });

  describe('Cart Validation', () => {
    test('should validate valid cart', () => {
      const validCart = global.createMockCart([
        global.createMockCartItem(),
        global.createMockCartItem({ id: 'gid://shopify/Product/1234567891' })
      ]);
      
      const validated = securityManager.validateCart(validCart);
      expect(validated).toBeDefined();
      expect(validated.length).toBe(2);
    });

    test('should reject non-array cart', () => {
      expect(() => {
        securityManager.validateCart('not-an-array');
      }).toThrow('Cart must be an array');
    });

    test('should reject empty cart', () => {
      expect(() => {
        securityManager.validateCart([]);
      }).toThrow('Cart cannot be empty');
    });

    test('should reject oversized cart', () => {
      const oversizedCart = Array(51).fill().map((_, i) => 
        global.createMockCartItem({ id: `gid://shopify/Product/${i}` })
      );
      
      expect(() => {
        securityManager.validateCart(oversizedCart);
      }).toThrow('Too many items in cart');
    });

    test('should reject cart with invalid items', () => {
      const invalidCart = [
        global.createMockCartItem(),
        global.createMockCartItem({ id: 'invalid-id' })
      ];
      
      expect(() => {
        securityManager.validateCart(invalidCart);
      }).toThrow('Invalid items detected in cart');
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize HTML content', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = securityManager.sanitizeHTML(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('alert("xss")');
    });

    test('should sanitize text input', () => {
      const maliciousInput = '<img src=x onerror=alert("xss")>';
      const sanitized = securityManager.sanitizeInput(maliciousInput, 'text');
      
      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('alert("xss")');
    });

    test('should sanitize email input', () => {
      const maliciousInput = 'test<script>alert("xss")</script>@example.com';
      const sanitized = securityManager.sanitizeInput(maliciousInput, 'email');
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('test@example.com');
    });

    test('should sanitize number input', () => {
      const maliciousInput = '123abc';
      const sanitized = securityManager.sanitizeInput(maliciousInput, 'number');
      
      expect(sanitized).toBe(0); // Invalid number becomes 0
    });

    test('should limit input length', () => {
      const longInput = 'a'.repeat(200);
      const sanitized = securityManager.sanitizeInput(longInput, 'text');
      
      expect(sanitized.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Security Event Logging', () => {
    test('should log security events', () => {
      securityManager.logSecurityEvent('TEST_EVENT', { test: 'data' });
      
      expect(console.warn).toHaveBeenCalledWith(
        'SECURITY_EVENT:',
        expect.stringContaining('TEST_EVENT')
      );
    });

    test('should classify event severity correctly', () => {
      const highSeverityEvent = 'CSRF_TOKEN_INVALID';
      const mediumSeverityEvent = 'INVALID_PRODUCT_TITLE';
      
      const highSeverity = securityManager.getSeverity(highSeverityEvent);
      const mediumSeverity = securityManager.getSeverity(mediumSeverityEvent);
      
      expect(highSeverity).toBe('HIGH');
      expect(mediumSeverity).toBe('MEDIUM');
    });

    test('should store security logs in localStorage', () => {
      securityManager.logSecurityEvent('TEST_EVENT', { test: 'data' });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'security-logs',
        expect.any(String)
      );
    });

    test('should limit log storage to 100 entries', () => {
      // Create 101 security events
      for (let i = 0; i < 101; i++) {
        securityManager.logSecurityEvent('TEST_EVENT', { index: i });
      }
      
      // Check that localStorage was called for the 100th entry
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'security-logs',
        expect.any(String)
      );
      
      // Parse the stored logs to verify count
      const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
      const logs = JSON.parse(lastCall[1]);
      expect(logs.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing localStorage gracefully', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      
      // Should not throw error
      expect(() => {
        securityManager.storeSecurityLog({ test: 'data' });
      }).not.toThrow();
      
      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });

    test('should handle invalid JSON in localStorage', () => {
      // Mock localStorage to return invalid JSON
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      // Should not throw error
      expect(() => {
        securityManager.storeSecurityLog({ test: 'data' });
      }).not.toThrow();
    });

    test('should handle rate limiting with invalid timestamps', () => {
      // Mock Date.now to return invalid values
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 'invalid-timestamp');
      
      // Should handle gracefully
      expect(() => {
        securityManager.checkRateLimit('test');
      }).not.toThrow();
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });
});
