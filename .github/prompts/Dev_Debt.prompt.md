<!-- PROMPT_ID::HEADER --># Directory-Specific Development Debt Document

<!-- PROMPT_ID::INSTRUCTIONS_SECTION -->## Instructions for Processing Dev_Debt.md Files

<!-- PROMPT_FIELD::INSTRUCTIONS_INTRO -->When processing a Dev_Debt.md file:

<!-- PROMPT_LIST::INSTRUCTIONS_STEPS -->
<!-- PROMPT_ITEM::INSTR_PARSE -->1. Parse the document to identify technical debt items
<!-- PROMPT_ITEM::INSTR_ANALYZE -->2. Analyze only the files in the same directory as the Dev_Debt.md file
<!-- PROMPT_ITEM::INSTR_GENERATE -->3. Generate specific, actionable solutions for each task
<!-- PROMPT_ITEM::INSTR_EXAMPLES -->4. Include code examples where appropriate
<!-- PROMPT_ITEM::INSTR_LINES -->5. Reference specific line numbers in the related files
<!-- PROMPT_ITEM::INSTR_CRITERIA -->6. Provide clear acceptance criteria for completion
<!-- PROMPT_ITEM::INSTR_EFFORT -->7. Estimate the effort required for each task

<!-- PROMPT_ID::TEMPLATE_SECTION -->## Template Structure

<!-- PROMPT_CODE::TEMPLATE_MARKDOWN -->
```markdown
# Development Debt Document

## Overview
[Brief description of the technical debt this document addresses within this specific directory]

## Action Items
- [ ] Task 1: [Clear, specific description]
- [ ] Task 2: [Clear, specific description]
- [ ] Task 3: [Clear, specific description]

## Priority
[High/Medium/Low]

## Estimated Effort
[Hours or story points]

## Implementation Notes
[Any specific implementation details or considerations]

## Acceptance Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

## Related Files
- [file path relative to this directory]
- [another file path relative to this directory]

## Dependencies
[Any dependencies that need to be resolved first]

## Assigned To
[Developer name or team]
```

<!-- PROMPT_ID::GUIDELINES_SECTION -->## Processing Guidelines

<!-- PROMPT_LIST::GUIDELINES_RULES -->
<!-- PROMPT_ITEM::GUIDELINE_FOCUS -->- Focus on files listed in the "Related Files" section
<!-- PROMPT_ITEM::GUIDELINE_SCOPE -->- Only suggest changes to files in the same directory
<!-- PROMPT_ITEM::GUIDELINE_DETAILS -->- Provide detailed implementation steps
<!-- PROMPT_ITEM::GUIDELINE_REFS -->- Include specific code references for each action item
<!-- PROMPT_ITEM::GUIDELINE_TESTS -->- Recommend tests that should be added or updated
<!-- PROMPT_ID::FOOTER -->
<!-- SchemaVersion: 1.0.0 -->
<!-- PromptID: dev_debt_prompt -->