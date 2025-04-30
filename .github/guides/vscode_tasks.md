# VSCode Task Automation

## Overview

This guide explains our approach to centralizing automation through VSCode tasks, eliminating the need for separate script files.

## Task Configuration

All automation tasks should be defined in the `.vscode/tasks.json` file:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Example Task",
      "type": "shell",
      "command": "npm run example",
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

## Task Categories

Our tasks are organized into these categories:

1. **Build Tasks** - Compilation and bundling
2. **Test Tasks** - Running tests and coverage
3. **Deploy Tasks** - Deployment and publishing
4. **Lint Tasks** - Code quality checks
5. **Doc Tasks** - Documentation generation

## CLI Command Migration

All CLI commands should be migrated to VSCode tasks:

| Old Command | New Task |
|-------------|----------|
| `npm run build` | VSCode Task: `build` |
| `npm run test` | VSCode Task: `test` |
| `npm run lint` | VSCode Task: `lint` |

## Running Tasks

Tasks can be executed via:

- Command Palette (`Ctrl+Shift+P` → "Tasks: Run Task")
- Terminal command: `npx vscode-tasks <taskname>`
- Custom keybindings in `keybindings.json`
