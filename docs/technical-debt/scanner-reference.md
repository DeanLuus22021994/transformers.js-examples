# Technical Debt Scanner Reference

## Overview

The Technical Debt Scanner is a core component of the Development Debt Management System. It scans codebase files for designated markers that indicate technical debt and generates comprehensive reports that can be used to track and manage debt over time.

## Debt Markers

By default, the scanner recognizes the following debt markers:

| Marker | Purpose |
|--------|---------|
| `#debt:` | Indicates actual technical debt that should be addressed |
| `#improve:` | Suggests an improvement that would be beneficial but is not critical |
| `#refactor:` | Marks code that needs restructuring or clean-up |
| `#fixme:` | Highlights an issue that needs immediate attention |
| `#todo:` | Indicates planned work that has not been completed |

These markers can be customized through configuration.

## Configuration

The scanner can be configured through several methods:

1. **VS Code Settings**:

   ```json
   {
     "devDebtProcessor.enabled": true,
     "devDebtProcessor.scanOnSave": false,
     "devDebtProcessor.autoCreateReports": false
   }
   ```

2. **YAML Configuration File**: Place a `debt-config.yml` file in any of these locations:
   - `.github/debt-management/config/debt-config.yml`
   - `.github/debt-config.yml`
   - `debt-config.yml`

   Example configuration:

   ```yaml
   markers:
     - marker: "#debt:"
       weight: 10
     - marker: "#improve:"
       weight: 5
     - marker: "#refactor:"
       weight: 7
   include_patterns:
     - "*.js"
     - "*.ts"
   exclude_patterns:
     - "node_modules"
     - "dist"
   ```

## Implementation Details

The scanner is implemented using Node.js native capabilities:

- Uses the `glob` package for efficient file matching
- Leverages the `readline` interface for line-by-line file processing
- Supports async/await patterns for better performance and readability
- Implements proper error handling and logging

## Architecture

The scanner follows a modular architecture:

1. **Configuration Service**: Loads and manages scanner configuration
2. **Scanner Service**: Performs the actual scanning operation
3. **Reporter Service**: Generates reports based on scan results
4. **VS Code Integration Layer**: Connects the scanner to VS Code

This design ensures:

- Separation of concerns
- Testability of individual components
- Easy maintenance and extension

## Testing

The scanner components are fully tested using Jest:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## API Reference

### DebtScannerService

```javascript
/**
 * @param {Object} options Configuration options
 * @param {Array<string>} [options.markers] Debt markers to scan for
 * @param {Array<string>} [options.includePatterns] File patterns to include
 * @param {Array<string>} [options.excludePatterns] File patterns to exclude
 * @param {Object} logger Logger instance
 */
constructor(options = {}, logger)

/**
 * @param {string} workspacePath Path to the workspace to scan
 * @returns {Promise<{reportPath: string, totalCount: number}>} Results of the scan
 */
async scanWorkspace(workspacePath)
```
