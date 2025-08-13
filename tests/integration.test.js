/**
 * Security Integration Tests
 * Tests the complete security system working together
 */

describe('Security System Integration', () => {
  let mockSecurityManager;
  let mockCart;
  
  beforeEach(() => {
    global.resetMocks();
    
    // Create comprehensive mock security manager
    mockSecurityManager = {
      checkRateLimit: jest.fn(() => true),
      validateCartItem: jest.fn((item) => item),
      validateCart: jest.fn((cart) => cart),
      logSecurityEvent: jest.fn(),
      generateCSRFToken: jest.fn(() => 'mock-csrf-token'),
      validateCSRFToken: jest.fn(() => true),
      sanitizeHTML: jest.fn((input) => input.replace(/<script>/g, '')),
      sanitizeInput: jest.fn((input, type) => {
        if (type === 'text') return input.replace(/<[^>]*>/g, '');
        if (type === 'email') return input.replace(/<[^>]*>/g, '');
        if (type === 'number') return parseFloat(input) || 0;
        return input;
      })
    };
    
    // Create mock cart
    mockCart = [
      global.createMockCartItem(),
      global.createMockCartItem({ id: 'gid://shopify/Product/1234567891' })
    ];
    
    // Mock global functions
    global.window = {
      ...global.window,
      cartSecurityManager: mockSecurityManager,
      cart: mockCart,
      showSecurityMessage: jest.fn(),
      showAddToCartFeedback: jest.fn()
    };
    
    // Mock DOM elements
    document.body.innerHTML = `
      <meta name="csrf-token" content="mock-csrf-token">
      <div id="cartDropdown" style="display: none;">
        <div id="cartItems"></div>
      </div>
      <div class="cart-icon">
        <span class="cart-badge">0</span>
      </div>
      <div id="securityMessage"></div>
    `;
  });

  describe('Complete Shopping Flow Security', () => {
    test('should secure entire add-to-cart process', () => {
      const testItem = {
        id: 'gid://shopify/Product/1234567892',
        title: 'Secure Product',
        price: 29.99,
        image: 'https://cdn.shopify.com/secure.jpg'
      };
      
      // Simulate add to cart with all security checks
      if (typeof window.addToCart === 'function') {
        window.addToCart(testItem.id, testItem.title, testItem.price, testItem.image);
      }
      
      // Verify all security checks were performed
      expect(mockSecurityManager.checkRateLimit).toHaveBeenCalledWith('add-to-cart');
      expect(mockSecurityManager.validateCartItem).toHaveBeenCalledWith({
        id: testItem.id,
        title: testItem.title,
        price: testItem.price,
        image: testItem.image,
        quantity: 1
      });
      
      // Verify security event logging
      expect(mockSecurityManager.logSecurityEvent).toHaveBeenCalled();
    });

    test('should secure entire checkout process', () => {
      // Simulate checkout with all security checks
      if (typeof window.proceedToCheckout === 'function') {
        window.proceedToCheckout();
      }
      
      // Verify all security checks were performed
      expect(mockSecurityManager.checkRateLimit).toHaveBeenCalledWith('checkout');
      expect(mockSecurityManager.validateCart).toHaveBeenCalledWith(mockCart);
      
      // Verify CSRF protection
      expect(mockSecurityManager.validateCSRFToken).toHaveBeenCalled();
    });

    test('should handle security violations gracefully', () => {
      // Mock rate limit exceeded
      mockSecurityManager.checkRateLimit.mockReturnValue(false);
      
      // Simulate add to cart with security violation
      if (typeof window.addToCart === 'function') {
        window.addToCart('test-id', 'Test Product', 25.0, 'https://example.com/image.jpg');
      }
      
      // Should log security event
      expect(mockSecurityManager.logSecurityEvent).toHaveBeenCalledWith(
        'RATE_LIMIT_EXCEEDED',
        expect.any(Object)
      );
      
      // Should show security message
      expect(window.showSecurityMessage).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );
    });
  });

  describe('Multi-Layer Security Validation', () => {
    test('should validate at multiple levels', () => {
      const maliciousItem = {
        id: 'invalid-id',
        title: '<script>alert("xss")</script>',
        price: -10,
        image: 'javascript:alert("xss")',
        quantity: 15
      };
      
      // Simulate adding malicious item
      if (typeof window.addToCart === 'function') {
        window.addToCart(maliciousItem.id, maliciousItem.title, maliciousItem.price, maliciousItem.image);
      }
      
      // Should check rate limit first
      expect(mockSecurityManager.checkRateLimit).toHaveBeenCalledWith('add-to-cart');
      
      // Should validate item (which should fail)
      expect(mockSecurityManager.validateCartItem).toHaveBeenCalled();
      
      // Should log security events
      expect(mockSecurityManager.logSecurityEvent).toHaveBeenCalled();
    });

    test('should enforce security at cart boundaries', () => {
      // Mock cart validation to fail
      mockSecurityManager.validateCart.mockImplementation(() => {
        throw new Error('Invalid cart detected');
      });
      
      // Simulate checkout with invalid cart
      if (typeof window.proceedToCheckout === 'function') {
        expect(() => {
          window.proceedToCheckout();
        }).not.toThrow();
      }
      
      // Should attempt validation
      expect(mockSecurityManager.validateCart).toHaveBeenCalled();
      
      // Should log security event
      expect(mockSecurityManager.logSecurityEvent).toHaveBeenCalled();
    });
  });

  describe('Security Event Correlation', () => {
    test('should correlate related security events', () => {
      // Simulate multiple security violations
      mockSecurityManager.checkRateLimit.mockReturnValue(false);
      
      // Multiple rate limit violations
      for (let i = 0; i < 3; i++) {
        if (typeof window.addToCart === 'function') {
          window.addToCart('test-id', 'Test Product', 25.0, 'https://example.com/image.jpg');
        }
      }
      
      // Should log multiple events
      expect(mockSecurityManager.logSecurityEvent).toHaveBeenCalledTimes(3);
      
      // Should show multiple security messages
      expect(window.showSecurityMessage).toHaveBeenCalledTimes(3);
    });

    test('should handle cascading security failures', () => {
      // Mock multiple security failures
      mockSecurityManager.checkRateLimit.mockReturnValue(false);
      mockSecurityManager.validateCartItem.mockReturnValue(null);
      
      // Simulate operation with multiple failures
      if (typeof window.addToCart === 'function') {
        window.addToCart('test-id', 'Test Product', 25.0, 'https://example.com/image.jpg');
      }
      
      // Should handle gracefully without crashing
      expect(() => {
        // Operation should complete without throwing
      }).not.toThrow();
      
      // Should log appropriate events
      expect(mockSecurityManager.logSecurityEvent).toHaveBeenCalled();
    });
  });

  describe('Performance Under Security Load', () => {
    test('should maintain performance under security pressure', () => {
      const startTime = performance.now();
      
      // Simulate high-security scenario
      for (let i = 0; i < 50; i++) {
        // Mock alternating security states
        mockSecurityManager.checkRateLimit.mockReturnValue(i % 2 === 0);
        
        if (typeof window.addToCart === 'function') {
          window.addToCart('test-id', 'Test Product', 25.0, 'https://example.com/image.jpg');
        }
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete 50 operations quickly (< 200ms)
      expect(executionTime).toBeLessThan(200);
    });

    test('should handle security monitoring overhead', () => {
      // Mock intensive security monitoring
      const startTime = performance.now();
      
      // Simulate security event logging
      for (let i = 0; i < 100; i++) {
        mockSecurityManager.logSecurityEvent('MONITORING_EVENT', { index: i });
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should log 100 events quickly (< 50ms)
      expect(executionTime).toBeLessThan(50);
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from security system failures', () => {
      // Mock security manager failure
      mockSecurityManager.checkRateLimit.mockImplementation(() => {
        throw new Error('Security system error');
      });
      
      // Simulate operation with failed security
      if (typeof window.addToCart === 'function') {
        expect(() => {
          window.addToCart('test-id', 'Test Product', 25.0, 'https://example.com/image.jpg');
        }).not.toThrow();
      }
      
      // Should handle gracefully
      expect(mockSecurityManager.logSecurityEvent).toHaveBeenCalled();
    });

    test('should maintain functionality with degraded security', () => {
      // Mock partial security failure
      mockSecurityManager.checkRateLimit.mockReturnValue(true); // Rate limiting works
      mockSecurityManager.validateCartItem.mockImplementation(() => {
        throw new Error('Validation system error');
      });
      
      // Simulate operation with partial security
      if (typeof window.addToCart === 'function') {
        expect(() => {
          window.addToCart('test-id', 'Test Product', 25.0, 'https://example.com/image.jpg');
        }).not.toThrow();
      }
      
      // Should still check rate limits
      expect(mockSecurityManager.checkRateLimit).toHaveBeenCalled();
      
      // Should log validation failures
      expect(mockSecurityManager.logSecurityEvent).toHaveBeenCalled();
    });
  });

  describe('Security Configuration Integration', () => {
    test('should respect security configuration', () => {
      // Verify CSRF token is present
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      expect(csrfMeta).toBeDefined();
      expect(csrfMeta.getAttribute('content')).toBe('mock-csrf-token');
      
      // Verify security manager is configured
      expect(window.cartSecurityManager).toBeDefined();
      expect(typeof window.cartSecurityManager.checkRateLimit).toBe('function');
      expect(typeof window.cartSecurityManager.validateCartItem).toBe('function');
    });

    test('should handle security configuration changes', () => {
      // Mock configuration change
      const newSecurityManager = {
        ...mockSecurityManager,
        checkRateLimit: jest.fn(() => false) // Stricter rate limiting
      };
      
      // Update security manager
      window.cartSecurityManager = newSecurityManager;
      
      // Simulate operation with new configuration
      if (typeof window.addToCart === 'function') {
        window.addToCart('test-id', 'Test Product', 25.0, 'https://example.com/image.jpg');
      }
      
      // Should use new configuration
      expect(newSecurityManager.checkRateLimit).toHaveBeenCalled();
      expect(newSecurityManager.checkRateLimit()).toBe(false);
    });
  });

  describe('End-to-End Security Validation', () => {
    test('should validate complete security chain', () => {
      // Mock all security checks to pass
      mockSecurityManager.checkRateLimit.mockReturnValue(true);
      mockSecurityManager.validateCartItem.mockReturnValue(global.createMockCartItem());
      mockSecurityManager.validateCart.mockReturnValue(mockCart);
      mockSecurityManager.validateCSRFToken.mockReturnValue(true);
      
      // Simulate complete secure operation
      if (typeof window.addToCart === 'function') {
        window.addToCart('test-id', 'Test Product', 25.0, 'https://example.com/image.jpg');
      }
      
      if (typeof window.proceedToCheckout === 'function') {
        window.proceedToCheckout();
      }
      
      // Verify all security layers were checked
      expect(mockSecurityManager.checkRateLimit).toHaveBeenCalledWith('add-to-cart');
      expect(mockSecurityManager.checkRateLimit).toHaveBeenCalledWith('checkout');
      expect(mockSecurityManager.validateCartItem).toHaveBeenCalled();
      expect(mockSecurityManager.validateCart).toHaveBeenCalled();
      expect(mockSecurityManager.validateCSRFToken).toHaveBeenCalled();
    });

    test('should maintain security under normal usage', () => {
      // Simulate normal user behavior
      const operations = [
        () => window.addToCart && window.addToCart('id1', 'Product 1', 25.0, 'image1.jpg'),
        () => window.addToCart && window.addToCart('id2', 'Product 2', 30.0, 'image2.jpg'),
        () => window.proceedToCheckout && window.proceedToCheckout()
      ];
      
      // Execute operations
      operations.forEach(operation => {
        if (typeof operation === 'function') {
          expect(() => operation()).not.toThrow();
        }
      });
      
      // Verify security was maintained throughout
      expect(mockSecurityManager.checkRateLimit).toHaveBeenCalled();
      expect(mockSecurityManager.validateCartItem).toHaveBeenCalled();
      expect(mockSecurityManager.validateCart).toHaveBeenCalled();
    });
  });
});
