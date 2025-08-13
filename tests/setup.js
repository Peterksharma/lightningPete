// Jest setup file for testing environment
require('@testing-library/jest-dom');

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

// Mock performance API
global.performance = {
  getEntriesByType: jest.fn(() => []),
  now: jest.fn(() => Date.now()),
};

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock crypto for CSRF token generation
global.crypto = {
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-random-bytes')
  }))
};

// Mock btoa and atob for base64 encoding
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));
global.atob = jest.fn((str) => Buffer.from(str, 'base64').toString());

// Mock fetch for API testing
global.fetch = jest.fn();

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000/shop.html',
  origin: 'http://localhost:3000',
  pathname: '/shop.html'
};

// Mock window.navigator
delete window.navigator;
window.navigator = {
  userAgent: 'Jest Test Environment'
};

// Helper function to reset all mocks between tests
global.resetMocks = () => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
};

// Helper function to simulate DOM events
global.simulateEvent = (element, eventType, options = {}) => {
  const event = new Event(eventType, { bubbles: true, ...options });
  element.dispatchEvent(event);
  return event;
};

// Helper function to create mock cart data
global.createMockCartItem = (overrides = {}) => ({
  id: 'gid://shopify/Product/1234567890',
  title: 'Test Product',
  price: 25.0,
  image: 'https://cdn.shopify.com/s/files/1/123/test.jpg',
  quantity: 1,
  ...overrides
});

// Helper function to create mock cart
global.createMockCart = (items = []) => {
  if (items.length === 0) {
    items = [global.createMockCartItem()];
  }
  return items;
};
