# Technical Debt Scanner

## Overview

The Technical Debt Scanner is a Jest-based solution for identifying, tracking, and managing technical debt across the codebase. It leverages the Jest testing framework for real-time scanning and reporting, providing a lightweight and efficient approach to debt management.

## Features

- **Jest-Based Scanning**: Uses Jest's watch mode for real-time debt detection
- **DIR.TAG Format**: Supports structured tagging with directories and hashtags
- **VS Code Integration**: Seamless integration with VS Code tasks
- **Hyperlinked Reports**: Generated reports with clickable links to debt locations
- **Automatic Indexing**: Organized categorization of debt items

## Usage

### Tagging Technical Debt

You can tag technical debt in your code using two formats:

1. **Simple Marker**:

   ```javascript
   // #debt: This function has performance issues and needs optimization
   ```

2. **DIR.TAG Format** (recommended):

   ```javascript
   // DIR.TAG: /refactor/performance #optimization #memory-usage
   ```

Available markers:

- `#debt:` - Indicates actual technical debt that should be addressed
- `#improve:` - Suggests an improvement that would be beneficial but is not critical
- `#refactor:` - Marks code that needs restructuring or clean-up
- `#fixme:` - Highlights an issue that needs immediate attention
- `#todo:` - Indicates planned work that has not been completed
- `DIR.TAG:` - Structured tag with directory path and hashtags

### Running the Scanner

You can run the scanner in several ways:

1. **VS Code Task**:
   - Run "Scan Technical Debt" task for watch mode
   - Run "Generate Technical Debt Report" for a one-time report

2. **Command Line**:

   ```bash
   # Watch mode
   npx jest --watch --testMatch="**/debt-scanner.debt.test.js"

   # One-time report
   npx jest --testMatch="**/debt-scanner.debt.test.js" --watchAll=false
   ```

### Viewing Reports

Reports are generated in the `debt-reports` directory and can be opened in any Markdown viewer.

## How It Works

The scanner uses Jest's testing framework to:

1. Find files matching specified patterns
2. Scan each file for debt markers
3. Process and categorize the results
4. Generate a comprehensive Markdown report
5. Create individual test cases for each debt item

## Integration with Dev-Debt-Processor Extension

The scanner works alongside the dev-debt-processor VS Code extension, which provides:

1. UI commands for debt management
2. Templates for structured debt documentation
3. Log viewing and processing
4. Additional configuration options

## Architecture

The scanner follows a micro-modular architecture:

1. **File Discovery**: Locates files to scan using glob patterns
2. **Marker Detection**: Identifies debt markers in code
3. **Result Processing**: Processes and categorizes results
4. **Report Generation**: Creates formatted Markdown reports
5. **Test Creation**: Dynamically generates Jest test cases

This architecture ensures:

- Each component can be tested independently
- The system is easy to extend and modify
- Processing is efficient and scalable

## Extending the Scanner

You can extend the scanner by:

1. Adding new markers in the `DEBT_MARKERS` array
2. Modifying the report format in the `generateReport` function
3. Adding custom processing for special marker types
4. Creating additional test cases for specific debt categories

## Best Practices

1. Use the DIR.TAG format for structured debt documentation
2. Add meaningful hashtags for easier categorization
3. Run in watch mode during development for real-time feedback
4. Generate comprehensive reports before code reviews
5. Update or remove debt tags when addressing issues
