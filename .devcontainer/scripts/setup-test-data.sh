#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up test data for dev debt processor...${NC}"

# Create necessary directories
mkdir -p .config/modules
mkdir -p .config/environments
mkdir -p .config/audit
mkdir -p .config/projects
mkdir -p .config/state
mkdir -p .dev-debt-logs
mkdir -p reports/traceability
mkdir -p reports/retrospectives
mkdir -p reports/dev-debt
mkdir -p .github/templates/dev-debt

# Copy or create the dev debt template in GitHub templates directory
echo -e "${GREEN}Setting up dev debt templates...${NC}"

# Create dev debt templates
cat > .github/templates/dev-debt/template.md << EOF
# Development Debt Document

## Overview
[Brief description of the technical debt this document addresses]

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
- [file path 1]
- [file path 2]

## Dependencies
[Any dependencies that need to be resolved first]

## Assigned To
[Developer name or team]
EOF

# Create feature request template
cat > .github/templates/dev-debt/feature-request.md << EOF
# Feature Request

## Overview
[Brief description of the feature requested]

## Motivation
[Why is this feature needed?]

## Proposed Implementation
[How might this feature be implemented?]

## Acceptance Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

## Related Components
- [Component 1]
- [Component 2]

## Dependencies
[Any dependencies for this feature]

## Priority
[High/Medium/Low]

## Assigned To
[Developer name or team]
EOF

# Create bug fix template
cat > .github/templates/dev-debt/bug-fix.md << EOF
# Bug Fix

## Overview
[Brief description of the bug]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Possible Causes
[Theories about what might cause the bug]

## Proposed Solution
[How to fix the bug]

## Related Files
- [file path 1]
- [file path 2]

## Priority
[High/Medium/Low]

## Assigned To
[Developer name or team]
EOF

# Create refactoring template
cat > .github/templates/dev-debt/refactoring.md << EOF
# Code Refactoring

## Overview
[Brief description of the refactoring needed]

## Current Issues
[What problems exist in the current implementation]

## Proposed Changes
[What changes should be made]

## Expected Benefits
[How the code will improve after refactoring]

## Risk Assessment
[Potential risks and how to mitigate them]

## Related Files
- [file path 1]
- [file path 2]

## Estimated Effort
[Hours or story points]

## Priority
[High/Medium/Low]

## Assigned To
[Developer name or team]
EOF

# Create test Dev_Debt.md file for testing
echo -e "${GREEN}Creating sample Dev_Debt.md file for testing...${NC}"
mkdir -p dean-transformers/test-module

cat > dean-transformers/test-module/Dev_Debt.md << EOF
# Development Debt Document

## Overview
This is a test dev debt document to verify the processing functionality.

## Action Items
- [ ] Task 1: Implement proper error handling
- [ ] Task 2: Add unit tests for core functionality
- [ ] Task 3: Refactor the main processing loop

## Priority
Medium

## Estimated Effort
4 hours

## Implementation Notes
This is just a test file to ensure the dev debt processor is working correctly.

## Acceptance Criteria
- All tasks are completed
- Code passes linting
- Tests are added and passing

## Related Files
- index.js
- processor.js

## Dependencies
None

## Assigned To
Test Developer
EOF

# Create a sample env file with Azure connection information
echo -e "${GREEN}Creating sample .env file with Azure connection information...${NC}"
cat > .env.example << EOF
# Azure Connection Information
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

# For local development with Azurite
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;QueueEndpoint=http://azurite:10001/devstoreaccount1;TableEndpoint=http://azurite:10002/devstoreaccount1;

# Log Analytics
AZURE_LOG_WORKSPACE_ID=your-workspace-id
AZURE_LOG_KEY=your-workspace-key
EOF

echo -e "${GREEN}Test data setup complete!${NC}"