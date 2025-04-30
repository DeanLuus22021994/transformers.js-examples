/**
 * Global Jest setup for consistent test environment across all test files
 */

// Azure environment variables setup
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.AZURE_LOCATION = 'eastus';
process.env.USE_AZURITE = 'true';

// Standard timeout for all tests (can be overridden in specific tests)
jest.setTimeout(30000);

// Common console mocks
beforeAll(() => {
  // Save original console methods
  global._consoleMethods = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };

  // Replace with jest mocks by default
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

// Restore console methods after tests
afterAll(() => {
  console.log = global._consoleMethods.log;
  console.error = global._consoleMethods.error;
  console.warn = global._consoleMethods.warn;
  console.info = global._consoleMethods.info;
});

// Mock fetch globally when needed
global.originalFetch = global.fetch;