#!/bin/bash

# This script builds all the submodules in the correct order

set -e  # Exit on error
cd /workspaces/transformers.js-examples

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if GPU is available
check_gpu() {
  if command_exists nvidia-smi; then
    echo "NVIDIA GPU detected"
    export HAS_GPU=true
    # Get GPU memory in MB
    GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | awk '{print $1}')
    export GPU_MEM_GB=$(echo "scale=1; $GPU_MEM/1024" | bc)
    echo "GPU memory: ${GPU_MEM_GB}GB"
  else
    echo "No NVIDIA GPU detected"
    export HAS_GPU=false
    export GPU_MEM_GB=0
  fi
}

# Check GPU status
check_gpu

# Build transformers.js
echo "Building transformers.js..."
cd /workspaces/transformers.js
npm install
npm run build
cd - > /dev/null

# Build github-mcp-server
echo "Building github-mcp-server..."
cd /workspaces/github-mcp-server
npm install
npm run build
cd - > /dev/null

# Build linuxkit (requires Go)
echo "Building linuxkit..."
cd /workspaces/linuxkit
if command_exists go; then
  make
else
  echo "Go not found, skipping linuxkit build"
fi
cd - > /dev/null

# Build VSCode
echo "Building VSCode..."
cd /workspaces/vscode
yarn
yarn compile
cd - > /dev/null

# Build each example project in the transformers.js-examples repository
echo "Building transformers.js-examples projects..."

# Function to check if a project should be built based on GPU requirements
should_build_project() {
  local project_dir=$1
  local min_gpu_gb=${2:-0}

  # Skip build if GPU memory is less than required
  if [ "$HAS_GPU" = true ] && [ $(echo "$GPU_MEM_GB < $min_gpu_gb" | bc) -eq 1 ]; then
    echo "Skipping $project_dir due to insufficient GPU memory (requires ${min_gpu_gb}GB, available ${GPU_MEM_GB}GB)"
    return 1
  fi

  return 0
}

# Build transformers.js examples with specific GPU requirements
EXAMPLES_DIR="/workspaces/transformers.js-examples"

# Standard projects - no special GPU requirements
for project in "vanilla-js" "node-cjs" "node-esm" "whisper-node" "bun"; do
  echo "Building $project..."
  if [ -f "$EXAMPLES_DIR/$project/package.json" ]; then
    cd "$EXAMPLES_DIR/$project"
    npm install
    npm run build || echo "No build script found for $project"
    cd - > /dev/null
  fi
done

# WebGPU projects - require GPU
for project in "janus-webgpu" "smollm-webgpu" "webgpu-clip" "webgpu-nomic-embed"; do
  if should_build_project "$project" 5; then
    echo "Building $project..."
    if [ -f "$EXAMPLES_DIR/$project/package.json" ]; then
      cd "$EXAMPLES_DIR/$project"
      npm install
      npm run build || echo "No build script found for $project"
      cd - > /dev/null
    fi
  fi
done

# Update the main package.json and install dependencies
cd "$EXAMPLES_DIR"
npm install

echo "All builds completed successfully"
