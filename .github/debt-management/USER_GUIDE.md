# Technical Debt Management User Guide

## Introduction

The Technical Debt Management System helps track, document, and manage technical debt across the codebase. This guide explains how to use the system effectively.

## Marking Technical Debt in Code

Use these standardized tags in your code comments:

| Tag | Purpose | Priority |
|-----|---------|----------|
| `#debt:` | Identified technical debt | High |
| `#improve:` | Area for improvement | Medium |
| `#refactor:` | Code needing refactoring | Medium |
| `#fixme:` | Critical issue | High |
| `#todo:` | Future enhancement | Low |

### Example:

```javascript
// #debt: This function has O(n²) complexity and needs optimization
function inefficientFunction(data) {
  // Implementation
}
```

## Running the Scanner

### Option 1: VS Code Task
1. Open VS Code Command Palette (`Ctrl+Shift+P`)
2. Type "Tasks: Run Task"
3. Select "Scan Technical Debt"

### Option 2: PowerShell Script
```powershell
.\Invoke-DebtScanner.ps1
```

### Option 3: Batch File
```
scan-debt.bat
```

### Option 4: Docker Compose
```bash
docker-compose -f docker-compose.debt-scanner.yml up --build
```

## Creating a Development Debt Document

For major debt items, create a formal document:

1. Copy the template: `.github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE.md`
2. Fill out all sections
3. Save in the relevant directory near the affected code
4. Reference the document in code comments:
   ```javascript
   // #debt: See ./DEBT.md for details on the performance issues
   ```

## Understanding Reports

After running the scanner, two reports are generated:

1. **debt-report.md**: Raw scan results with all debt items
2. **debt-weekly-report.md**: Summary with trends and recommendations

Reports include:
- Total debt items
- Breakdown by type and directory
- Trend analysis
- Recommendations for debt reduction

## Automation

The system automatically:
1. Scans for debt on PRs to main branches
2. Generates a weekly debt report (Mondays at 9 AM)
3. Creates a GitHub issue with the weekly report

## Configuration

Customize the scanner in `.github/debt-management/config/debt-config.yml`:
- Add or modify debt markers
- Change file patterns to include/exclude
- Adjust reporting settings
