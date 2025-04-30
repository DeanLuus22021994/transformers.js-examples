# Directory-Specific Development Debt Document

## Instructions for Processing Dev_Debt.md Files

When processing a Dev_Debt.md file:

1. Parse the document to identify technical debt items
2. Analyze only the files in the same directory as the Dev_Debt.md file
3. Generate specific, actionable solutions for each task
4. Include code examples where appropriate
5. Reference specific line numbers in the related files
6. Provide clear acceptance criteria for completion
7. Estimate the effort required for each task

## Template Structure

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

## Processing Guidelines

- Focus on files listed in the "Related Files" section
- Only suggest changes to files in the same directory
- Provide detailed implementation steps
- Include specific code references for each action item
- Recommend tests that should be added or updated