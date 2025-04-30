# Technical Debt Management System

This system helps manage, track, and report on technical debt in the codebase.

## Features
- Automated scanning for debt markers in code
- Weekly debt reports
- Issue generation for tracking
- Docker container for local execution
- VS Code integration

## Usage

### Code Markers
Use these markers in your code comments:
- `#debt:` - Identified technical debt
- `#improve:` - Area for improvement
- `#refactor:` - Code that needs refactoring

Example:
```js
// #debt: This function needs optimization for large data sets
function processData(data) {
  // ...
}
```

### Running the Scanner
- **GitHub Actions**: The scanner runs automatically weekly and on PRs
- **Locally**: Use the VS Code task "Scan Technical Debt" or run:
  ```bash
  docker-compose -f docker-compose.debt-scanner.yml up --build
  ```

### Documentation
Create a debt document using the template:
1. Copy `.github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE.md`
2. Fill out the sections
3. Store in the relevant directory with the code it documents

## Configuration
Edit `.github/debt-management/config/debt-config.yml` to customize:
- Debt markers
- File patterns
- Issue settings
