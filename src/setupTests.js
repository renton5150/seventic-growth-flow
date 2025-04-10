
// This file is used by Jest to configure the test environment
// Add here any setup code that should run before your tests

// Mock console methods to reduce noise during tests
// Comment these out if you need to see console output during tests
global.console = {
  ...global.console,
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn() // Keep this one mocked to reduce noise
};

// Add any global test utilities or mock functions here
