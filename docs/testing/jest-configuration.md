# Jest Configuration and Testing Guide

## Overview

This project uses Jest as its primary testing framework. This document provides an overview of the Jest configuration and guidelines for writing effective tests.

## Jest Configuration

The Jest configuration is defined in `jest.config.js`:

```javascript
module.exports = {
  verbose: true,
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'services/**/*.js',
    'utils/**/*.js',
    '!tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

Key aspects of the configuration:

1. **Test Environment**: Node.js environment for backend-focused code
2. **Coverage Requirements**: Minimum 70% coverage across all metrics
3. **Test Pattern**: Files ending with `.test.js` or `.spec.js`
4. **Ignored Paths**: `node_modules` directory is excluded from testing

## Running Tests

Tests can be run using the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs tests when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test File Organization

Tests are organized to mirror the structure of the source code:

```
dev-debt-processor/
├── services/
│   ├── debt-scanner-service.js
│   └── ...
├── tests/
│   ├── debt-scanner-service.test.js
│   └── ...
```

## Writing Effective Tests

### Test Structure

Each test file should follow this general structure:

```javascript
// Imports
const { expect } = require('chai');
const sinon = require('sinon');
const ModuleToTest = require('../path/to/module');

describe('ModuleName', () => {
  let instance;
  let mocks;

  beforeEach(() => {
    // Setup test instance and mocks
    mocks = {
      dependency1: sinon.stub(),
      dependency2: sinon.stub()
    };

    instance = new ModuleToTest(mocks.dependency1, mocks.dependency2);
  });

  afterEach(() => {
    // Cleanup
    sinon.restore();
  });

  describe('methodName', () => {
    it('should do expected behavior when condition', () => {
      // Arrange
      mocks.dependency1.returns('expected value');

      // Act
      const result = instance.methodName('input');

      // Assert
      expect(result).to.equal('expected output');
      expect(mocks.dependency1).to.have.been.calledWith('input');
    });
  });
});
```

### Testing Guidelines

1. **Arrange-Act-Assert (AAA) Pattern**:
   - Arrange: Set up the test scenario
   - Act: Execute the code being tested
   - Assert: Verify the results

2. **Mock External Dependencies**:
   - Use sinon for creating stubs, spies, and mocks
   - Isolate the code under test from external dependencies

3. **Test Both Successful and Error Paths**:
   - Test the happy path (successful execution)
   - Test error handling and edge cases

4. **Use Descriptive Test Names**:
   - Test names should describe the expected behavior
   - Follow the pattern "should [expected behavior] when [condition]"

5. **Keep Tests Focused**:
   - Each test should verify a specific behavior
   - Avoid testing multiple behaviors in a single test

## Testing VS Code Extensions

Testing VS Code extensions requires special handling:

1. **Mock the VS Code API**:

   ```javascript
   const vscode = {
     window: {
       showInformationMessage: sinon.stub(),
       setStatusBarMessage: sinon.stub()
     },
     commands: {
       executeCommand: sinon.stub()
     }
   };
   ```

2. **Use Extension Test Utilities**:

   ```javascript
   const testUtils = require('../test-utils');

   describe('Extension', () => {
     it('should activate properly', async () => {
       const extension = await testUtils.loadExtension();
       expect(extension).to.not.be.undefined;
     });
   });
   ```

## Watch Mode

Jest's watch mode is a powerful tool for development:

1. **Interactive Mode**:
   - Press `a` to run all tests
   - Press `f` to run only failing tests
   - Press `p` to filter by file name pattern
   - Press `t` to filter by test name pattern

2. **Usage**:

   ```bash
   npm run test:watch
   ```

## Coverage Reports

Coverage reports help identify untested code:

1. **Running Coverage**:

   ```bash
   npm run test:coverage
   ```

2. **Interpreting Results**:
   - Look for functions, branches, or statements with low coverage
   - Focus on improving coverage in critical business logic

## Continuous Integration

Tests are automatically run in the CI pipeline:

1. **Pull Requests**:
   - All tests must pass before merging
   - Coverage thresholds must be met

2. **Configuration**:
   - CI configuration is defined in `.github/workflows/test.yml`
