# Technical Debt Management System
<!-- README_ID::HEADER -->

<!-- README_ID::DESCRIPTION -->This system helps manage, track, and report on technical debt in the codebase.

<!-- README_ID::FEATURES_SECTION -->## Features
<!-- README_ITEM::FEATURE_SCANNING -->- Automated scanning for debt markers in code
<!-- README_ITEM::FEATURE_REPORTS -->- Weekly debt reports
<!-- README_ITEM::FEATURE_ISSUES -->- Issue generation for tracking
<!-- README_ITEM::FEATURE_DOCKER -->- Docker container for local execution
<!-- README_ITEM::FEATURE_VSCODE -->- VS Code integration

<!-- README_ID::USAGE_SECTION -->## Usage

<!-- README_ID::USAGE_MARKERS_SUBSECTION -->### Code Markers
<!-- README_FIELD::USAGE_MARKERS_DESC -->Use these markers in your code comments:
<!-- README_TABLE::MARKERS -->
| Marker       | Purpose                     |
| ------------ | --------------------------- |
| `#debt:`     | Identified technical debt   |
| `#improve:`  | Area for improvement        |
| `#refactor:` | Code that needs refactoring |

<!-- README_FIELD::USAGE_MARKERS_EXAMPLE_LABEL -->Example:
<!-- README_CODE::MARKERS_EXAMPLE -->
```js
// #debt: This function needs optimization for large data sets
function processData(data) {
  // ...
}
```

<!-- README_ID::USAGE_SCANNER_SUBSECTION -->### Running the Scanner
<!-- README_FIELD::USAGE_SCANNER_DESC -->
- <!-- README_ITEM::SCANNER_ACTIONS -->**GitHub Actions**: The scanner runs automatically weekly and on PRs
- <!-- README_ITEM::SCANNER_LOCAL -->**Locally**: Use the VS Code task "Scan Technical Debt" or run:
  <!-- README_CODE::SCANNER_DOCKER -->
  ```bash
  docker-compose -f docker-compose.debt-scanner.yml up --build
  ```

<!-- README_ID::USAGE_DOCS_SUBSECTION -->### Documentation
<!-- README_FIELD::USAGE_DOCS_DESC -->Create a debt document using the template:
<!-- README_LIST::DOCS_STEPS -->
1. <!-- README_ITEM::DOCS_STEP_1 -->Copy `.github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE.md`
2. <!-- README_ITEM::DOCS_STEP_2 -->Fill out the sections
3. <!-- README_ITEM::DOCS_STEP_3 -->Store in the relevant directory with the code it documents

<!-- README_ID::CONFIG_SECTION -->## Configuration
<!-- README_FIELD::CONFIG_DESC -->Edit `.github/debt-management/config/debt-config.yml` to customize:
<!-- README_LIST::CONFIG_OPTIONS -->
- <!-- README_ITEM::CONFIG_MARKERS -->Debt markers
- <!-- README_ITEM::CONFIG_PATTERNS -->File patterns
- <!-- README_ITEM::CONFIG_ISSUES -->Issue settings

<!-- README_ID::FOOTER -->
<!-- SchemaVersion: 1.0.0 -->
<!-- DocID: ROOT_README -->
