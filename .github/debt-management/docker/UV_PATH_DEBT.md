# Development Debt Document

## Overview
This document addresses technical debt related to Docker container build failures caused by UV package manager installation issues. The UV binary is not being properly linked to the system path, causing subsequent commands to fail with "uv: not found" errors.

## Action Items
- [x] Task 1: Fix symbolic linking by using correct paths (/root/.local/bin instead of ~/.cargo/bin)
- [x] Task 2: Add export PATH statements to ensure UV is accessible during build
- [ ] Task 3: Create a validation step in entrypoint.sh to verify UV installation
- [ ] Task 4: Document UV dependency in README.md and system requirements

## Priority
High

## Estimated Effort
2 hours

## Implementation Notes
The issue occurs because the UV installer places binaries in /root/.local/bin, but the Dockerfile attempts to create a symbolic link from ~/.cargo/bin, which is incorrect. Additionally, the PATH environment variable needs to be updated to include /root/.local/bin.

Fixes include:
1. Updating the symbolic link path to point to the correct location
2. Adding PATH export statements in relevant RUN commands
3. Adding the PATH update to .bashrc for persistence

## Acceptance Criteria
- Docker image builds successfully without "uv: not found" errors
- UV package manager is accessible in all build stages
- Python dependencies are correctly installed using UV
- Health check passes when container starts

## Related Files
- c:\Projects\transformers.js-examples\.github\debt-management\docker\Dockerfile
- c:\Projects\transformers.js-examples\.github\debt-management\docker\docker-compose.yml
- c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\entrypoint.sh
- c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\health-check.js

## Dependencies
None - this is a blocking issue that must be resolved before other container-based tasks.

## Assigned To
DevOps Team

<!-- SchemaVersion: 1.0.0 -->
<!-- InstructionSetID: format_dev_debt_docs -->
