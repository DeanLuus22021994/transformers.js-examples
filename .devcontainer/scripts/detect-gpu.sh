#!/bin/bash

# detect-gpu.sh - A script to detect NVIDIA GPU and set environment variables
# This will be used by the container to determine if GPU acceleration is available

set -e

echo "Checking for NVIDIA GPU..."

if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU detected"

    # Get GPU information
    GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader)
    GPU_NAME=$(echo "$GPU_INFO" | cut -d',' -f1)
    GPU_MEM_MB=$(echo "$GPU_INFO" | cut -d',' -f2 | tr -d ' MiB')
    GPU_DRIVER=$(echo "$GPU_INFO" | cut -d',' -f3)

    # Convert to GB
    GPU_MEM_GB=$(echo "scale=1; $GPU_MEM_MB/1024" | bc)

    # Export variables
    export HAS_GPU=true
    export GPU_NAME="$GPU_NAME"
    export GPU_MEM_GB="$GPU_MEM_GB"
    export GPU_DRIVER="$GPU_DRIVER"

    echo "GPU: $GPU_NAME"
    echo "Memory: ${GPU_MEM_GB}GB"
    echo "Driver: $GPU_DRIVER"

    # Store in a file that can be sourced by other scripts
    echo "HAS_GPU=true" > /tmp/gpu-env
    echo "GPU_NAME=\"$GPU_NAME\"" >> /tmp/gpu-env
    echo "GPU_MEM_GB=$GPU_MEM_GB" >> /tmp/gpu-env
    echo "GPU_DRIVER=\"$GPU_DRIVER\"" >> /tmp/gpu-env
else
    echo "No NVIDIA GPU detected"
    export HAS_GPU=false
    export GPU_MEM_GB=0

    # Store in a file that can be sourced by other scripts
    echo "HAS_GPU=false" > /tmp/gpu-env
    echo "GPU_MEM_GB=0" >> /tmp/gpu-env
fi

# Check if minimum GPU memory is available for WebGPU projects
MIN_WEBGPU_MEM=5
if [ "$HAS_GPU" = "true" ] && [ $(echo "$GPU_MEM_GB >= $MIN_WEBGPU_MEM" | bc) -eq 1 ]; then
    echo "GPU memory is sufficient for WebGPU projects"
    export CAN_RUN_WEBGPU=true
    echo "CAN_RUN_WEBGPU=true" >> /tmp/gpu-env
else
    echo "WARNING: GPU memory is below recommended minimum (${MIN_WEBGPU_MEM}GB) for WebGPU projects"
    export CAN_RUN_WEBGPU=false
    echo "CAN_RUN_WEBGPU=false" >> /tmp/gpu-env
fi

# Print summary
echo "Environment variables set:"
echo "HAS_GPU=$HAS_GPU"
echo "GPU_MEM_GB=$GPU_MEM_GB"
echo "CAN_RUN_WEBGPU=$CAN_RUN_WEBGPU"
