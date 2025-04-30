#!/bin/bash

# GPU-aware Docker build script for transformers.js-examples
# This script detects GPU availability and builds the appropriate Docker images

set -e

# Base directory
BASE_DIR=$(pwd)
echo "Working directory: $BASE_DIR"

# Check for Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check for GPU availability using nvidia-smi
echo "Checking for NVIDIA GPU availability..."
if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected!"

    # Get GPU information
    GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader)
    GPU_NAME=$(echo "$GPU_INFO" | cut -d',' -f1)
    GPU_MEM_MB=$(echo "$GPU_INFO" | cut -d',' -f2 | tr -d ' MiB')
    GPU_DRIVER=$(echo "$GPU_INFO" | cut -d',' -f3)

    # Convert to GB
    GPU_MEM_GB=$(echo "scale=1; $GPU_MEM_MB/1024" | bc)

    echo "GPU: $GPU_NAME"
    echo "Memory: ${GPU_MEM_GB}GB"
    echo "Driver: $GPU_DRIVER"

    # Check for NVIDIA Container Toolkit
    if docker info | grep -q "Runtimes:.*nvidia"; then
        echo "✅ NVIDIA Container Toolkit is installed"
        HAS_GPU=true
        GPU_BUILD=true
    else
        echo "⚠️ NVIDIA Container Toolkit is not installed properly."
        echo "GPU is available but won't be accessible from Docker containers."
        HAS_GPU=true
        GPU_BUILD=false
    fi

    # Check if GPU memory is sufficient for WebGPU projects
    MIN_WEBGPU_MEM=5
    if [ $(echo "$GPU_MEM_GB >= $MIN_WEBGPU_MEM" | bc) -eq 1 ]; then
        echo "✅ GPU memory is sufficient for WebGPU projects"
        CAN_RUN_WEBGPU=true
    else
        echo "⚠️ GPU memory is below recommended minimum (${MIN_WEBGPU_MEM}GB) for WebGPU projects"
        CAN_RUN_WEBGPU=false
    fi
else
    echo "ℹ️ No NVIDIA GPU detected. Building for CPU-only mode."
    HAS_GPU=false
    GPU_BUILD=false
    CAN_RUN_WEBGPU=false
    GPU_MEM_GB=0
fi

# Export environment variables for build process
export HAS_GPU=$HAS_GPU
export GPU_MEM_GB=$GPU_MEM_GB
export CAN_RUN_WEBGPU=$CAN_RUN_WEBGPU

# Save environment variables to a file for other scripts to use
echo "# GPU Environment Configuration - $(date)" > "$BASE_DIR/.env.gpu"
echo "HAS_GPU=$HAS_GPU" >> "$BASE_DIR/.env.gpu"
echo "GPU_MEM_GB=$GPU_MEM_GB" >> "$BASE_DIR/.env.gpu"
echo "CAN_RUN_WEBGPU=$CAN_RUN_WEBGPU" >> "$BASE_DIR/.env.gpu"

echo ""
echo "Building Docker containers for transformers.js-examples"
echo "-----------------------------------------------------"

# Function to build project-specific Docker images
build_project_docker() {
    local project=$1

    if [ -f "$BASE_DIR/$project/Dockerfile" ] && [ -f "$BASE_DIR/$project/docker-compose.yml" ]; then
        echo "Building Docker image for $project..."

        # Create .env file for docker-compose
        echo "HAS_GPU=$HAS_GPU" > "$BASE_DIR/$project/.env"
        echo "GPU_MEM_GB=$GPU_MEM_GB" >> "$BASE_DIR/$project/.env"
        echo "CAN_RUN_WEBGPU=$CAN_RUN_WEBGPU" >> "$BASE_DIR/$project/.env"

        # Build the Docker image
        cd "$BASE_DIR/$project"
        docker-compose build
        cd "$BASE_DIR"

        echo "✅ Built Docker image for $project"
    fi
}

# Build the main test container based on GPU availability
echo "Building main test container..."
if $GPU_BUILD; then
    echo "Using GPU-enabled configuration"
    docker-compose -f docker-compose.test.yml build test-gpu
    # Create a symbolic link to the current active configuration
    echo "test-gpu" > .active-test-config
else
    echo "Using CPU-only configuration"
    docker-compose -f docker-compose.test.yml build test-no-gpu
    # Create a symbolic link to the current active configuration
    echo "test-no-gpu" > .active-test-config
fi

# Build project-specific Docker images
echo "Building project-specific Docker images..."

# Always build non-GPU projects
build_project_docker "vanilla-js"
build_project_docker "node-cjs"
build_project_docker "node-esm"
build_project_docker "whisper-node"

# Build WebGPU projects only if sufficient GPU memory
if $CAN_RUN_WEBGPU; then
    build_project_docker "janus-webgpu"
    build_project_docker "smollm-webgpu"
    build_project_docker "webgpu-clip"
    build_project_docker "webgpu-nomic-embed"
fi

echo ""
echo "Build process complete!"
echo "To run tests: npm run test:${HAS_GPU:+gpu:no-gpu}"
