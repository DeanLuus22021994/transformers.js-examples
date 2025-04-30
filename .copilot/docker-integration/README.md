# Transformers.js Docker Integration

This system provides a seamless Docker integration for transformers.js examples, with automated Docker Swarm management, advanced caching mechanisms, and Copilot integration.

## Features

- **Automated Docker Environment**: Automatically manages the Docker environment for transformers.js examples
- **Docker Swarm Management**: Initializes and manages Docker Swarm for distributed workloads
- **Advanced Caching**: Optimizes performance through intelligent caching of models and Docker layers
- **Seamless Copilot Integration**: Provides Copilot with Docker-aware capabilities
- **Terminal Integration**: Automatically initializes when a terminal is opened in VS Code
- **GPU Acceleration**: Automatically detects and utilizes GPU acceleration when available

## Getting Started

### Prerequisites

- Docker Desktop installed and running
- Node.js 16+ installed
- VS Code with the "Remote - Containers" extension

### Installation

1. Clone this repository
2. Run the initialization script:

```
cd .copilot/docker-integration
npm install
node scripts/init.js
```

3. Open a new terminal in VS Code to automatically initialize the Docker integration

### Commands

The Docker integration provides a CLI tool called `tdocker` that you can use to interact with the system:

- `tdocker status`: Show status of Docker services
- `tdocker start`: Start Docker services
- `tdocker stop`: Stop Docker services
- `tdocker restart`: Restart Docker services
- `tdocker logs`: Show logs from Docker services
- `tdocker cache`: Manage the model cache
- `tdocker help`: Show help

## Configuration

The system can be configured via the `config/config.json` file:

- `cacheDir`: Directory for caching models
- `cacheSize`: Maximum size of the cache
- `cacheTtl`: Time-to-live for cached items
- `docker.swarm.enabled`: Whether to use Docker Swarm
- `autoStart`: Whether to automatically start Docker services
- `gpu.enabled`: Whether to use GPU acceleration

## Architecture

The Docker integration system follows SOLID principles and is composed of several components:

- **Docker Client**: Interacts with the Docker Engine API
- **Swarm Manager**: Manages Docker Swarm lifecycle
- **Cache Manager**: Optimizes performance through caching
- **Terminal Hook Manager**: Integrates with VS Code terminal
- **Logger**: Provides comprehensive logging
- **Config Manager**: Handles configuration persistence

## Contributing

Contributions are welcome! Please follow the standard pull request workflow:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
