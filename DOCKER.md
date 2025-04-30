# Transformers.js Examples - Docker Setup

This document explains how to use the Docker-based development and testing setup for the transformers.js-examples repository.

## Prerequisites

- Docker and Docker Compose
- NVIDIA GPU (optional, but recommended for WebGPU examples)
- NVIDIA Container Toolkit (for GPU acceleration in Docker)

## Getting Started

### 1. Build Docker Images

```bash
# Build all Docker images (detects GPU automatically)
npm run docker:build
```

This command will:

- Detect if you have an NVIDIA GPU
- Check if the NVIDIA Container Toolkit is properly installed
- Build the appropriate Docker images based on your hardware
- Create project-specific Docker images for individual examples

### 2. Run Tests

```bash
# Run all applicable tests (GPU or non-GPU based on available hardware)
npm run docker:test:all

# Run only non-GPU tests
npm run docker:test:no-gpu

# Run tests with coverage
npm run docker:test:coverage

# Run specific tests (vanilla-js, node-esm, etc.)
npm run docker:test -- --test=vanilla-js
```

## GPU Requirements

- The WebGPU examples (janus-webgpu, smollm-webgpu, etc.) require at least 5GB of GPU memory
- If your GPU has less memory, these tests will be skipped automatically
- All non-WebGPU tests will run regardless of GPU availability

## Project-Specific Docker Environments

Each project example has its own Docker configuration:

```bash
# Run a specific project in Docker
cd vanilla-js
docker-compose up

# Or for WebGPU projects
cd janus-webgpu
docker-compose up
```

## VS Code Tasks

The repository includes VS Code tasks for common operations:

- **Docker: Build Test Containers** - Builds all Docker images
- **Docker: Run All Tests** - Runs all applicable tests in Docker
- **Docker: Run Tests with Coverage** - Runs tests with coverage reporting
- **Docker: Run GPU Tests** - Runs only GPU-dependent tests
- **Docker: Run Non-GPU Tests** - Runs only non-GPU tests

## Environment Variables

The Docker setup automatically sets the following environment variables:

- `HAS_GPU`: Whether an NVIDIA GPU is available (true/false)
- `GPU_MEM_GB`: How much GPU memory is available (in GB)
- `CAN_RUN_WEBGPU`: Whether WebGPU examples can run on this hardware

## Volume Mounts

The Docker setup uses optimized volume mounts:

- All node_modules are cached in persistent volumes
- Project files use delegated consistency for better performance
- Each project example has its own volume for node_modules

## Troubleshooting

If the NVIDIA GPU is not being detected in Docker:

1. Make sure the NVIDIA Container Toolkit is installed:

   ```bash
   sudo apt-get install -y nvidia-container-toolkit
   ```

2. Restart the Docker daemon:

   ```bash
   sudo systemctl restart docker
   ```

3. Verify the NVIDIA runtime is working:

   ```bash
   docker run --rm --gpus all nvidia/cuda:12.0.0-runtime-ubuntu22.04 nvidia-smi
   ```

If you see GPU information, Docker can access the GPU properly.
