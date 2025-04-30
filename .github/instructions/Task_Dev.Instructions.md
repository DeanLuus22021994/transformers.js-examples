# DevContainer Specialist Instructions for VS Code Integration

## Overview

This document provides specialized guidance for working with `.devcontainer` configurations in transformers.js-examples projects. Follow these instructions when developing or modifying container configurations to ensure compliance with the DevContainers specification (https://devcontainers.github.io/) and VS Code best practices.

## Project Structure Reference

The development environment is configured in the `.devcontainer` directory with the following structure:

- Core configuration: devcontainer.json, docker-compose.yml, Dockerfile
- PowerShell automation: maintenance.ps1, tdocker.ps1
- Shell scripting: tdocker.sh
- Scripts directory with subdirectories:
- checks/ - Contains validation scripts for GPU and Azure environment
- precompile/ - Handles model precompilation
- setup/ - Contains environment initialization scripts
- utils/ - Common utility scripts for logging and shared functions
- Volumes directory with:
- cache/ - For caching model files
- config/ - Configuration files including device_map.json
- node_modules/ - Shared Node.js modules
- precompiled/ - Storage for precompiled models

## Container Configuration Guidelines

### devcontainer.json Standards

1. Always implement proper `postCreateCommand` and `postStartCommand` hooks
2. Configure appropriate VS Code extensions in the `customizations.vscode.extensions` array
3. Set correct `remoteUser` to avoid permission issues with mounted volumes
4. Configure `forwardPorts` for any services running in the container
5. Set `workspaceMount` and `workspaceFolder` paths correctly for the project

### Docker Compose Integration

1. Use service names that clearly indicate their purpose
2. Configure GPU passthrough using the established NVIDIA container runtime syntax
3. Implement health checks for critical services
4. Structure volume mounts for optimal performance and persistence
5. Define appropriate environment variables in the compose file

### GPU Acceleration

1. Use `scripts/checks/gpu-check.sh` to detect NVIDIA hardware
2. Configure runtime detection for both CUDA and ROCm environments
3. Implement proper device mapping via device_map.json
4. Include fallback paths for CPU-only environments

## PowerShell Automation Standards

### Logging Format

Use consistent logging prefixes:

- `[INFO]` - General information
- `[WARNING]` - Non-critical issues
- `[FATAL]` - Critical issues requiring immediate exit
- `[GPU]` - GPU-related information
- `[NextSteps]` - User guidance blocks
- `[ContainerStatus]` - Container health reporting
- `[MaintenanceLogStart/End]` - Maintenance operation blocks

### Error Handling

1. Validate all required paths before operations
2. Implement proper exit codes (0 for success, 1 for failure)
3. Catch and log all exceptions with meaningful messages
4. Check for required tools before attempting to use them

### Cross-Platform Compatibility

1. Check for and normalize line endings with dos2unix when available
2. Detect and adapt to WSL environments
3. Use platform-agnostic path handling
4. Ensure all scripts have executable permissions

## VS Code Integration Points

1. Configure `launch.json` for debugging containerized applications
2. Set appropriate `tasks.json` configurations for build operations
3. Implement proper settings in `.vscode/settings.json` for container development
4. Use the Remote-Containers extension (now Dev Containers) effectively

## Transformers.js Specific Requirements

1. Ensure proper node_modules volume mounting
2. Configure precompile processes for model optimization
3. Implement proper device detection and mapping
4. Structure Azure integration for cloud deployment scenarios

Reference the official VS Code Dev Containers documentation (https://code.visualstudio.com/docs/devcontainers/containers) for additional guidance on container configuration best practices.
