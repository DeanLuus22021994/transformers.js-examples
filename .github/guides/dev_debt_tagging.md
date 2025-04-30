# Development Debt Tagging System

## Overview

The DIR.TAG system provides a standardized way to track, categorize, and resolve technical debt through comment-based tagging.

## Tag Format

```javascript
// DIR.TAG: #category #priority
// Description of the issue
// @link: https://reference-link-or-documentation
```

## Supported Categories

- #architecture - Structural issues requiring redesign
- #performance - Optimizations needed
- #security - Security concerns or vulnerabilities
- #testing - Missing or inadequate test coverage
- #documentation - Missing or outdated documentation
- #accessibility - Accessibility concerns
- #refactor - Code that needs to be reworked
- #dependency - Outdated or problematic dependencies

## Priority Levels

- #p0 - Critical (blocker)
- #p1 - High priority
- #p2 - Medium priority
- #p3 - Low priority

## Automation Integration

The DIR.TAG system integrates with our Jest-based monitoring system:

1. Tags are automatically detected by `jest --watch`
2. Changes to tags trigger the automation pipeline
3. Reports are generated in the `.github/reports/dev_debt` directory
4. Actionable items appear in the project's GitHub issues
