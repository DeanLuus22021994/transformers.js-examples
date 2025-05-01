<!-- INSTR_ID::HEADER --># DevContainer Specialist Instructions for VS Code Integration

<!-- INSTR_ID::OVERVIEW_SECTION -->## Overview

<!-- INSTR_FIELD::OVERVIEW_DESC -->This document provides specialized guidance for working with `.devcontainer` configurations in transformers.js-examples projects. Follow these instructions when developing or modifying container configurations to ensure compliance with the DevContainers specification (https://devcontainers.github.io/) and VS Code best practices.

<!-- INSTR_ID::PROJECT_STRUCTURE_SECTION -->## Project Structure Reference

<!-- INSTR_FIELD::PROJECT_STRUCTURE_INTRO -->The development environment is configured in the `.devcontainer` directory with the following structure:

<!-- INSTR_ITEM::STRUCTURE_CORE -->- Core configuration: devcontainer.json, docker-compose.yml, Dockerfile
<!-- INSTR_ITEM::STRUCTURE_PS -->- PowerShell automation: maintenance.ps1, tdocker.ps1
<!-- INSTR_ITEM::STRUCTURE_SH -->- Shell scripting: tdocker.sh
<!-- INSTR_ITEM::STRUCTURE_SCRIPTS -->- Scripts directory with subdirectories:
<!-- INSTR_ITEM::STRUCTURE_SCRIPTS_CHECKS -->- checks/ - Contains validation scripts for GPU and Azure environment
<!-- INSTR_ITEM::STRUCTURE_SCRIPTS_PRECOMPILE -->- precompile/ - Handles model precompilation
<!-- INSTR_ITEM::STRUCTURE_SCRIPTS_SETUP -->- setup/ - Contains environment initialization scripts
<!-- INSTR_ITEM::STRUCTURE_SCRIPTS_UTILS -->- utils/ - Common utility scripts for logging and shared functions
<!-- INSTR_ITEM::STRUCTURE_VOLUMES -->- Volumes directory with:
<!-- INSTR_ITEM::STRUCTURE_VOLUMES_CACHE -->- cache/ - For caching model files
<!-- INSTR_ITEM::STRUCTURE_VOLUMES_CONFIG -->- config/ - Configuration files including device_map.json
<!-- INSTR_ITEM::STRUCTURE_VOLUMES_NODE -->- node_modules/ - Shared Node.js modules
<!-- INSTR_ITEM::STRUCTURE_VOLUMES_PRECOMPILED -->- precompiled/ - Storage for precompiled models

<!-- INSTR_ID::CONTAINER_CONFIG_GUIDELINES_SECTION -->## Container Configuration Guidelines

<!-- INSTR_ID::DEVCONTAINER_JSON_SECTION -->### devcontainer.json Standards

<!-- INSTR_ITEM::JSON_HOOKS -->1. Always implement proper `postCreateCommand` and `postStartCommand` hooks
<!-- INSTR_ITEM::JSON_EXTENSIONS -->2. Configure appropriate VS Code extensions in the `customizations.vscode.extensions` array
<!-- INSTR_ITEM::JSON_REMOTE_USER -->3. Set correct `remoteUser` to avoid permission issues with mounted volumes
<!-- INSTR_ITEM::JSON_FORWARD_PORTS -->4. Configure `forwardPorts` for any services running in the container
<!-- INSTR_ITEM::JSON_WORKSPACE -->5. Set `workspaceMount` and `workspaceFolder` paths correctly for the project

<!-- INSTR_ID::DOCKER_COMPOSE_SECTION -->### Docker Compose Integration

<!-- INSTR_ITEM::COMPOSE_SERVICE_NAMES -->1. Use service names that clearly indicate their purpose
<!-- INSTR_ITEM::COMPOSE_GPU -->2. Configure GPU passthrough using the established NVIDIA container runtime syntax
<!-- INSTR_ITEM::COMPOSE_HEALTHCHECKS -->3. Implement health checks for critical services
<!-- INSTR_ITEM::COMPOSE_VOLUMES -->4. Structure volume mounts for optimal performance and persistence
<!-- INSTR_ITEM::COMPOSE_ENV_VARS -->5. Define appropriate environment variables in the compose file

<!-- INSTR_ID::GPU_ACCELERATION_SECTION -->### GPU Acceleration

<!-- INSTR_ITEM::GPU_CHECK_SCRIPT -->1. Use `scripts/checks/gpu-check.sh` to detect NVIDIA hardware
<!-- INSTR_ITEM::GPU_RUNTIME_DETECT -->2. Configure runtime detection for both CUDA and ROCm environments
<!-- INSTR_ITEM::GPU_DEVICE_MAP -->3. Implement proper device mapping via device_map.json
<!-- INSTR_ITEM::GPU_CPU_FALLBACK -->4. Include fallback paths for CPU-only environments

<!-- INSTR_ID::POWERSHELL_AUTOMATION_SECTION -->## PowerShell Automation Standards

<!-- INSTR_ID::LOGGING_FORMAT_SECTION -->### Logging Format

<!-- INSTR_FIELD::LOGGING_INTRO -->Use consistent logging prefixes:

<!-- INSTR_ITEM::LOG_INFO -->- `[INFO]` - General information
<!-- INSTR_ITEM::LOG_WARNING -->- `[WARNING]` - Non-critical issues
<!-- INSTR_ITEM::LOG_FATAL -->- `[FATAL]` - Critical issues requiring immediate exit
<!-- INSTR_ITEM::LOG_GPU -->- `[GPU]` - GPU-related information
<!-- INSTR_ITEM::LOG_NEXTSTEPS -->- `[NextSteps]` - User guidance blocks
<!-- INSTR_ITEM::LOG_CONTAINERSTATUS -->- `[ContainerStatus]` - Container health reporting
<!-- INSTR_ITEM::LOG_MAINTENANCE -->- `[MaintenanceLogStart/End]` - Maintenance operation blocks

<!-- INSTR_ID::ERROR_HANDLING_SECTION -->### Error Handling

<!-- INSTR_ITEM::ERR_VALIDATE_PATHS -->1. Validate all required paths before operations
<!-- INSTR_ITEM::ERR_EXIT_CODES -->2. Implement proper exit codes (0 for success, 1 for failure)
<!-- INSTR_ITEM::ERR_LOG_EXCEPTIONS -->3. Catch and log all exceptions with meaningful messages
<!-- INSTR_ITEM::ERR_CHECK_TOOLS -->4. Check for required tools before attempting to use them

<!-- INSTR_ID::CROSS_PLATFORM_SECTION -->### Cross-Platform Compatibility

<!-- INSTR_ITEM::XPLAT_LINE_ENDINGS -->1. Check for and normalize line endings with dos2unix when available
<!-- INSTR_ITEM::XPLAT_WSL -->2. Detect and adapt to WSL environments
<!-- INSTR_ITEM::XPLAT_PATHS -->3. Use platform-agnostic path handling
<!-- INSTR_ITEM::XPLAT_PERMISSIONS -->4. Ensure all scripts have executable permissions

<!-- INSTR_ID::VSCODE_INTEGRATION_SECTION -->## VS Code Integration Points

<!-- INSTR_ITEM::VSCODE_LAUNCH -->1. Configure `launch.json` for debugging containerized applications
<!-- INSTR_ITEM::VSCODE_TASKS -->2. Set appropriate `tasks.json` configurations for build operations
<!-- INSTR_ITEM::VSCODE_SETTINGS -->3. Implement proper settings in `.vscode/settings.json` for container development
<!-- INSTR_ITEM::VSCODE_EXTENSION -->4. Use the Remote-Containers extension (now Dev Containers) effectively

<!-- INSTR_ID::TRANSFORMERSJS_REQ_SECTION -->## Transformers.js Specific Requirements

<!-- INSTR_ITEM::TRANSJS_NODE_MODULES -->1. Ensure proper node_modules volume mounting
<!-- INSTR_ITEM::TRANSJS_PRECOMPILE -->2. Configure precompile processes for model optimization
<!-- INSTR_ITEM::TRANSJS_DEVICE_DETECT -->3. Implement proper device detection and mapping
<!-- INSTR_ITEM::TRANSJS_AZURE -->4. Structure Azure integration for cloud deployment scenarios

<!-- INSTR_ID::FOOTER -->
<!-- INSTR_FIELD::FOOTER_REF -->Reference the official VS Code Dev Containers documentation (https://code.visualstudio.com/docs/devcontainers/containers) for additional guidance on container configuration best practices.
<!-- SchemaVersion: 1.0.0 -->
<!-- InstructionSetID: task_dev_instructions -->
