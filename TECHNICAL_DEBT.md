# Technical Debt Management System

The Technical Debt Management System provides an integrated solution for tracking and managing technical debt across the codebase using Jest and VS Code automation.

## System Components

1. **VS Code Extension**
   - `.vscode/extensions/dev-debt-processor/` - Extension providing debt management tools
   - Modular architecture for better testing and maintainability

2. **Jest Integration**
   - Jest-based scanner with watch mode for real-time debt detection
   - Automatic report generation based on scanning results
   - Full test coverage of scanner components

3. **VS Code Tasks**
   - Integrated task system for running debt scans
   - Task: "Process Dev Debt Files" - Process debt documentation
   - Task: "Create Dev Debt Template" - Create new debt documentation
   - Task: "View Dev Debt Logs" - View processing logs

4. **Tagging System**
   - DIR.TAG structure with hashtag keys for easy identification
   - Hyperlinked references for better navigation
   - Automatic indexing of debt items

5. **Documentation Hub**
   - Centralized documentation in `/docs` directory
   - AI-friendly indexing with dynamic link propagation
   - Real-time updates from Jest scanning

## Using the System

1. **Tag code with debt markers:**

   ```javascript
   // #debt: This needs optimization
   // DIR.TAG: /refactor/performance #optimization #memory-usage
   ```

3. **Review generated reports in the `debt-reports` folder**

## Next Steps

1. Run an initial scan to establish a baseline
2. Review the report and prioritize debt items
3. Create detailed debt documents for major items
4. Develop a debt reduction plan
5. Track progress over time using weekly reports

For more information, see the [User Guide](.github/debt-management/USER_GUIDE.md).
