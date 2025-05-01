<!-- filepath: c:\Projects\transformers.js-examples\.github\USER_GUIDE.md -->
# Technical Debt Management User Guide
<!-- GUIDE_ID::HEADER -->

<!-- GUIDE_ID::INTRODUCTION_SECTION -->## Introduction

<!-- GUIDE_FIELD::INTRODUCTION_DESC -->The Technical Debt Management System helps track, document, and manage technical debt across the codebase. This guide explains how to use the system effectively.

<!-- GUIDE_ID::MARKING_DEBT_SECTION -->## Marking Technical Debt in Code

<!-- GUIDE_FIELD::MARKING_DEBT_INTRO -->Use these standardized tags in your code comments:

<!-- GUIDE_TABLE::DEBT_TAGS -->
| Tag          | Purpose                   | Priority |
| ------------ | ------------------------- | -------- |
| `#debt:`     | Identified technical debt | High     |
| `#improve:`  | Area for improvement      | Medium   |
| `#refactor:` | Code needing refactoring  | Medium   |
| `#fixme:`    | Critical issue            | High     |
| `#todo:`     | Future enhancement        | Low      |

<!-- GUIDE_ID::MARKING_EXAMPLE_SUBSECTION -->### Example:

<!-- GUIDE_CODE::MARKING_EXAMPLE_JS -->
```javascript
// #debt: This function has O(n²) complexity and needs optimization
function inefficientFunction(data) {
  // Implementation
}
```

<!-- GUIDE_ID::RUNNING_SCANNER_SECTION -->## Running the Scanner

<!-- GUIDE_ID::SCANNER_VSCODE_SUBSECTION -->### Option 1: VS Code Task
<!-- GUIDE_LIST::SCANNER_VSCODE_STEPS -->
1. <!-- GUIDE_ITEM::SCANNER_VSCODE_STEP1 -->Open VS Code Command Palette (`Ctrl+Shift+P`)
2. <!-- GUIDE_ITEM::SCANNER_VSCODE_STEP2 -->Type "Tasks: Run Task"
3. <!-- GUIDE_ITEM::SCANNER_VSCODE_STEP3 -->Select "Scan Technical Debt"

<!-- GUIDE_ID::SCANNER_POWERSHELL_SUBSECTION -->### Option 2: PowerShell Script
<!-- GUIDE_CODE::SCANNER_POWERSHELL_CMD -->
```powershell
.\Invoke-DebtScanner.ps1
```

<!-- GUIDE_ID::SCANNER_BATCH_SUBSECTION -->### Option 3: Batch File
<!-- GUIDE_CODE::SCANNER_BATCH_CMD -->
```batch
scan-debt.bat
```

<!-- GUIDE_ID::SCANNER_DOCKER_SUBSECTION -->### Option 4: Docker Compose
<!-- GUIDE_CODE::SCANNER_DOCKER_CMD -->
```bash
docker-compose -f docker-compose.debt-scanner.yml up --build
```

<!-- GUIDE_ID::CREATING_DEBT_DOC_SECTION -->## Creating a Development Debt Document

<!-- GUIDE_FIELD::CREATING_DEBT_DOC_INTRO -->For major debt items that require detailed planning, create a formal Development Debt Document:

<!-- GUIDE_LIST::CREATING_DEBT_DOC_STEPS -->
1. <!-- GUIDE_ITEM::DEBT_DOC_STEP1 -->**Copy the Template:** Find the template at `.github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE.md`.
2. <!-- GUIDE_ITEM::DEBT_DOC_STEP2 -->**Fill Out Sections:** Complete the following sections thoroughly:
    * <!-- GUIDE_ITEM::DEBT_DOC_FIELD_OVERVIEW -->**Overview:** Briefly describe the technical debt.
    * <!-- GUIDE_ITEM::DEBT_DOC_FIELD_ACTIONS -->**Action Items:** List specific, actionable tasks to resolve the debt.
    * <!-- GUIDE_ITEM::DEBT_DOC_FIELD_PRIORITY -->**Priority:** Assign High, Medium, or Low priority.
    * <!-- GUIDE_ITEM::DEBT_DOC_FIELD_EFFORT -->**Estimated Effort:** Estimate the time or complexity (e.g., hours, story points).
    * <!-- GUIDE_ITEM::DEBT_DOC_FIELD_NOTES -->**Implementation Notes:** Add technical details or considerations.
    * <!-- GUIDE_ITEM::DEBT_DOC_FIELD_CRITERIA -->**Acceptance Criteria:** Define how to verify the debt is resolved.
    * <!-- GUIDE_ITEM::DEBT_DOC_FIELD_FILES -->**Related Files:** List affected code files.
    * <!-- GUIDE_ITEM::DEBT_DOC_FIELD_DEPS -->**Dependencies:** Note any prerequisite tasks or issues.
    * <!-- GUIDE_ITEM::DEBT_DOC_FIELD_ASSIGNED -->**Assigned To:** Specify the developer or team responsible.
3. <!-- GUIDE_ITEM::DEBT_DOC_STEP3 -->**Save:** Place the document in a relevant directory near the affected code (e.g., create a `DEBT.md` file).
4. <!-- GUIDE_ITEM::DEBT_DOC_STEP4 -->**Reference in Code:** Link the document from the code comment:

   <!-- GUIDE_CODE::DEBT_DOC_REFERENCE_EXAMPLE -->
   ```javascript
   // #debt: Major refactoring needed. See ./DEBT.md for details.
   function complexLegacyCode() {
     // ...
   }
   ```

<!-- GUIDE_ID::UNDERSTANDING_REPORTS_SECTION -->## Understanding Reports

<!-- GUIDE_FIELD::REPORTS_INTRO -->After running the scanner, review the generated reports in the `debt-reports` directory (or as configured):

<!-- GUIDE_LIST::REPORT_TYPES -->
1. <!-- GUIDE_ITEM::REPORT_RAW -->**`debt-report.md`**: This is the raw output, listing every identified debt item with its location, tag, and the code line. Use this for a detailed view.
2. <!-- GUIDE_ITEM::REPORT_WEEKLY -->**`debt-weekly-report.md` (if configured)**: This provides a summary, often including:
    * <!-- GUIDE_ITEM::REPORT_SUMMARY_TOTAL -->**Total Debt Count:** Overall number of debt items.
    * <!-- GUIDE_ITEM::REPORT_SUMMARY_BREAKDOWN_TYPE -->**Breakdown by Type/Priority:** Counts for `#debt:`, `#fixme:`, `#improve:`, etc.
    * <!-- GUIDE_ITEM::REPORT_SUMMARY_BREAKDOWN_LOCATION -->**Breakdown by Location:** Debt distribution across directories or files.
    * <!-- GUIDE_ITEM::REPORT_SUMMARY_TREND -->**Trend Analysis:** How the debt count has changed over time (e.g., week over week).
    * <!-- GUIDE_ITEM::REPORT_SUMMARY_RECOMMENDATIONS -->**Recommendations:** Potential focus areas for debt reduction.

<!-- GUIDE_ID::INTERPRETING_REPORTS_SUBSECTION -->**Interpreting Reports:**

<!-- GUIDE_LIST::INTERPRETING_REPORTS_TIPS -->
* <!-- GUIDE_ITEM::INTERPRET_FOCUS_HIGH -->Focus on high-priority items (`#debt:`, `#fixme:`).
* <!-- GUIDE_ITEM::INTERPRET_CLUSTERS -->Look for clusters of debt in specific files or directories – these might indicate areas needing significant refactoring.
* <!-- GUIDE_ITEM::INTERPRET_TREND -->Monitor the trend analysis to ensure debt is being addressed over time.

<!-- GUIDE_ID::AUTOMATION_SECTION -->## Automation

<!-- GUIDE_FIELD::AUTOMATION_INTRO -->The system automatically:

<!-- GUIDE_LIST::AUTOMATION_FEATURES -->
1. <!-- GUIDE_ITEM::AUTOMATION_SCAN_PR -->Scans for debt on PRs to main branches
2. <!-- GUIDE_ITEM::AUTOMATION_REPORT_WEEKLY -->Generates a weekly debt report (Mondays at 9 AM)
3. <!-- GUIDE_ITEM::AUTOMATION_ISSUE_WEEKLY -->Creates a GitHub issue with the weekly report

<!-- GUIDE_ID::CONFIGURATION_SECTION -->## Configuration

<!-- GUIDE_FIELD::CONFIGURATION_INTRO -->Customize the scanner behavior by editing `.github/debt-management/config/debt-config.yml`:
<!-- GUIDE_LIST::CONFIG_OPTIONS -->
* <!-- GUIDE_ITEM::CONFIG_MARKERS -->**Markers:** Add, remove, or modify debt tags, their priorities, and associated labels/colors.
* <!-- GUIDE_ITEM::CONFIG_FILES -->**File Patterns:** Adjust `include_patterns` and `exclude_patterns` to control which files are scanned.
* <!-- GUIDE_ITEM::CONFIG_REPORTING -->**Reporting:** Configure summary generation, automatic issue creation, weekly digests, and author notifications.
* <!-- GUIDE_ITEM::CONFIG_ISSUES -->**Issue Settings:** Define prefixes for labels and the template used for created issues.

<!-- GUIDE_ID::BEST_PRACTICES_SECTION -->## Best Practices

<!-- GUIDE_LIST::BEST_PRACTICES -->
* <!-- GUIDE_ITEM::BP_SPECIFIC -->**Be Specific:** When adding a debt tag, clearly explain the problem and *why* it's debt (e.g., `#debt: Uses deprecated API call 'X', replace with 'Y'`).
* <!-- GUIDE_ITEM::BP_USE_DOCS -->**Use Debt Documents for Complex Issues:** Don't try to explain a major architectural flaw in a single comment line. Create a `DEBT.md`.
* <!-- GUIDE_ITEM::BP_REVIEW_REPORTS -->**Review Reports Regularly:** Make debt review a part of your team's routine (e.g., during sprint planning).
* <!-- GUIDE_ITEM::BP_PRIORITIZE -->**Prioritize Actively:** Use the reports to decide which debt items to tackle next based on priority and impact.
* <!-- GUIDE_ITEM::BP_CONFIG_UPDATED -->**Keep Configuration Updated:** Ensure the `debt-config.yml` reflects your current project structure and needs.
* <!-- GUIDE_ITEM::BP_INTEGRATE_EARLY -->**Integrate Early:** Run the scanner locally or in CI/CD to catch debt early.

<!-- GUIDE_ID::FOOTER -->
<!-- SchemaVersion: 1.0.0 -->
<!-- DocID: USER_GUIDE -->
