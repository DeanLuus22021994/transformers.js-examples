# Extension Architecture

## Overview

The dev-debt-processor extension follows a modular, layered architecture that promotes separation of concerns, testability, and maintainability. This document outlines the architectural design of the extension.

## Architectural Layers

The extension is organized into the following layers:

1. **Presentation Layer**: VS Code-specific code that interacts with the VS Code API
2. **Application Layer**: Core business logic and coordination between components
3. **Domain Layer**: Core domain models and business rules
4. **Infrastructure Layer**: Services and utilities that provide technical capabilities

## Component Structure

```
dev-debt-processor/
│
├── commands/ - VS Code command handlers
│   ├── process-dev-debt.js
│   ├── scan-debt-tags.js
│   ├── toggle-feature.js
│   ├── view-logs.js
│   └── ...
│
├── constants/ - Shared constants
│   ├── error-codes.js
│   └── ...
│
├── interfaces/ - Type definitions and interfaces
│   ├── scanner-interfaces.js
│   └── ...
│
├── services/ - Core business services
│   ├── debt-config-service.js - Configuration loading and management
│   ├── debt-scanner-service.js - File scanning implementation
│   ├── debt-reporter-service.js - Report generation
│   └── ...
│
├── tests/ - Unit and integration tests
│   ├── debt-scanner-service.test.js
│   ├── debt-config-service.test.js
│   └── ...
│
├── utils/ - Helper utilities and shared functionality
│   ├── config-manager.js - Base configuration management
│   ├── copilot-config-manager.js - Copilot-specific configuration
│   ├── logger.js - Logging functionality
│   ├── status-indicator.js - VS Code status bar management
│   └── ...
│
├── extension.js - Main extension entry point
├── package.json - Extension metadata and dependencies
└── jest.config.js - Test configuration
```

## Key Components

### Command Handlers

Command handlers are responsible for:

- Receiving input from VS Code commands
- Delegating to appropriate services
- Handling UI interactions and notifications
- Returning results to the VS Code environment

### Services

Services implement the core business logic:

1. **DebtConfigService**:
   - Loads configuration from various sources
   - Validates and merges configurations
   - Provides access to configuration values

2. **DebtScannerService**:
   - Scans files for debt markers
   - Processes and filters results
   - Aggregates findings

3. **DebtReporterService**:
   - Generates Markdown reports
   - Formats scan results into readable format
   - Creates trend analyses

### Utilities

Utilities provide shared functionality:

1. **ConfigManager**:
   - Base configuration management
   - XML-based configuration support

2. **CopilotConfigManager**:
   - Copilot-specific configuration
   - Integration with .copilot configuration files

3. **Logger**:
   - Structured logging
   - Log file management
   - Error tracking

4. **StatusIndicator**:
   - VS Code status bar integration
   - Visual status notifications

## Flow of Control

1. User initiates a command through VS Code
2. Command handler receives the request
3. Command handler delegates to appropriate services
4. Services perform business logic
5. Results are returned to the command handler
6. Command handler formats and presents results to the user

## Testing Strategy

The architecture supports a comprehensive testing strategy:

1. **Unit Tests**:
   - Test individual components in isolation
   - Mock dependencies for focused testing

2. **Integration Tests**:
   - Test interactions between components
   - Verify correct behavior of connected components

3. **End-to-End Tests**:
   - Test the complete flow from user command to result
   - Validate the entire system behavior

## Design Principles

The architecture follows these design principles:

1. **Single Responsibility Principle (SRP)**:
   - Each component has a single, well-defined responsibility

2. **Dependency Injection**:
   - Dependencies are passed in rather than created internally
   - Promotes testability and flexibility

3. **Interface Segregation**:
   - Components interact through clearly defined interfaces
   - Reduces coupling between components

4. **Command-Query Separation**:
   - Functions either perform an action or return data, not both
   - Improves reasoning about code behavior
