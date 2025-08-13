# E-commerce Security Testing Checklist

## 🧪 **Security Testing Guide for Performance Builder**

### **Pre-Testing Setup**
- [ ] Build the site with security features enabled
- [ ] Open browser developer tools (Console, Network, Application tabs)
- [ ] Clear browser localStorage and cookies
- [ ] Have multiple browser tabs/windows ready for testing

---

## **1. Input Validation & Sanitization Tests**

### **Cart Item Validation**
- [ ] **Valid Product ID**: Add product with valid Shopify ID format
  - ✅ Should work: `gid://shopify/Product/1234567890`
  - ❌ Should fail: `invalid-id`, `<script>alert('xss')</script>`
  
- [ ] **Valid Product Title**: Test title length and characters
  - ✅ Should work: "Green Hoodie", "Men's T-Shirt"
  - ❌ Should fail: Very long titles (>100 chars), HTML tags
  
- [ ] **Valid Price**: Test price ranges
  - ✅ Should work: $25.00, $99.99
  - ❌ Should fail: $0, $10000, negative prices
  
- [ ] **Valid Image URL**: Test image URL validation
  - ✅ Should work: `https://cdn.shopify.com/...`
  - ❌ Should fail: `http://`, `javascript:`, `data:text/html`

### **Quantity Validation**
- [ ] **Valid Quantities**: Test quantity limits
  - ✅ Should work: 1, 5, 10
  - ❌ Should fail: 0, 11, -1, "abc"

### **Cart Size Limits**
- [ ] **Cart Capacity**: Test maximum cart items
  - ✅ Should work: Add up to 50 different products
  - ❌ Should fail: Add 51st product (should show error)

---

## **2. Rate Limiting Tests**

### **Add to Cart Rate Limiting**
- [ ] **Normal Usage**: Add products at normal pace
  - ✅ Should work: Add 5-10 items over 1 minute
  
- [ ] **Rapid Fire**: Click "Add to Cart" rapidly
  - ❌ Should fail: After 10 rapid clicks in 1 minute
  - ✅ Should show: "Rate limit exceeded" message
  
- [ ] **Wait and Retry**: Wait 1 minute after rate limit
  - ✅ Should work: Can add items again

### **Other Operations Rate Limiting**
- [ ] **Remove Items**: Rapidly remove items
  - ❌ Should fail: After 10 rapid removals in 1 minute
  
- [ ] **Update Quantities**: Rapidly change quantities
  - ❌ Should fail: After 10 rapid updates in 1 minute
  
- [ ] **Checkout**: Rapidly click checkout
  - ❌ Should fail: After 5 rapid checkout attempts in 1 minute

---

## **3. CSRF Protection Tests**

### **CSRF Token Validation**
- [ ] **Valid Token**: Check if CSRF token is present
  - ✅ Should see: `<meta name="csrf-token" content="...">`
  
- [ ] **Token Format**: Verify token format
  - ✅ Should be: Base64 encoded string with timestamp
  
- [ ] **Token Expiry**: Test token expiration
  - ⏰ Wait 1+ hour (or modify code to test)
  - ❌ Should fail: Operations with expired token

---

## **4. Data Persistence Security**

### **localStorage Security**
- [ ] **Valid Cart Data**: Check localStorage contents
  - ✅ Should see: Valid JSON with validated items
  
- [ ] **Manipulated Data**: Manually edit localStorage
  - ❌ Should fail: Invalid data should be cleared
  - ✅ Should see: "Invalid cart data found, clearing cart" warning
  
- [ ] **Malicious Data**: Insert malicious data
  - ❌ Should fail: XSS attempts should be sanitized
  - ✅ Should see: Security events logged

---

## **5. XSS Prevention Tests**

### **HTML Injection**
- [ ] **Product Titles**: Try HTML in product titles
  - ❌ Should fail: `<script>alert('xss')</script>`
  - ✅ Should see: Sanitized text only
  
- [ ] **Cart Items**: Try HTML in cart display
  - ❌ Should fail: `<img src=x onerror=alert('xss')>`
  - ✅ Should see: Clean text display

### **JavaScript Injection**
- [ ] **Event Handlers**: Try JavaScript in data
  - ❌ Should fail: `javascript:alert('xss')`
  - ✅ Should see: Invalid input rejected

---

## **6. Content Security Policy Tests**

### **CSP Enforcement**
- [ ] **Console Errors**: Check for CSP violations
  - ✅ Should see: No CSP violation errors
  
- [ ] **External Scripts**: Try loading external scripts
  - ❌ Should fail: Scripts from unauthorized domains
  
- [ ] **Inline Scripts**: Check inline script execution
  - ✅ Should work: Only allowed inline scripts

---

## **7. Security Event Logging**

### **Event Monitoring**
- [ ] **Console Logs**: Check security event logging
  - ✅ Should see: "SECURITY_EVENT:" logs for violations
  
- [ ] **Event Types**: Verify different event types logged
  - ✅ Should see: Rate limiting, validation, CSRF events
  
- [ ] **Severity Levels**: Check severity classification
  - ✅ Should see: HIGH, MEDIUM, LOW severity events

### **Local Storage Logs**
- [ ] **Security Logs**: Check localStorage security logs
  - ✅ Should see: `security-logs` in Application tab
  - ✅ Should contain: Timestamp, event, details, severity

---

## **8. Performance Impact Tests**

### **Security vs Performance**
- [ ] **Lighthouse Score**: Run performance audit
  - ✅ Should maintain: 95+ performance score
  
- [ ] **Security Features**: Verify security is enabled
  - ✅ Should see: CSP headers, validation, rate limiting
  
- [ ] **User Experience**: Test normal shopping flow
  - ✅ Should work: Smooth, responsive cart operations

---

## **9. Edge Case Tests**

### **Boundary Conditions**
- [ ] **Maximum Values**: Test upper limits
  - ✅ Should work: 50 items, $9999.99 prices
  
- [ ] **Minimum Values**: Test lower limits
  - ✅ Should work: $0.01 prices, 1 item
  
- [ ] **Empty States**: Test edge cases
  - ✅ Should work: Empty cart, single item

### **Error Handling**
- [ ] **Network Errors**: Simulate network issues
  - ✅ Should handle: Graceful degradation
  
- [ ] **Invalid Data**: Test corrupted data
  - ✅ Should handle: Data validation and cleanup

---

## **10. Production Readiness Tests**

### **Environment Variables**
- [ ] **Configuration**: Check security settings
  - ✅ Should see: Proper CSP, rate limits, validation
  
- [ ] **Secrets**: Verify no hardcoded secrets
  - ✅ Should see: No API keys in source code

### **Monitoring Setup**
- [ ] **Alert System**: Test security alerts
  - ✅ Should see: Console errors for high-severity events
  
- [ ] **Log Retention**: Check log management
  - ✅ Should see: Limited log storage (100 entries)

---

## **🚨 Security Test Results Summary**

### **Passed Tests:**
- [ ] Input validation working correctly
- [ ] Rate limiting preventing abuse
- [ ] CSRF protection active
- [ ] XSS prevention effective
- [ ] Performance maintained
- [ ] Security logging functional

### **Failed Tests:**
- [ ] List any security issues found
- [ ] Note performance impacts
- [ ] Document unexpected behaviors

### **Recommendations:**
- [ ] Address any failed tests
- [ ] Consider additional security measures
- [ ] Plan production monitoring
- [ ] Document security procedures

---

## **🔧 Quick Test Commands**

```bash
# Build with security features
npm run build

# Serve for testing
npm run serve

# Check security logs in browser console
localStorage.getItem('security-logs')
```

**Test URL:** `http://localhost:3000/shop.html`

**Remember:** Security testing should be ongoing, not just a one-time checklist!
