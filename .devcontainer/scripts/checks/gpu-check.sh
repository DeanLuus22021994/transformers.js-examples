#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_step "Checking GPU availability..."

# Create log directory
mkdir -p .devcontainer/logs

# Check if nvidia-smi is available
if command_exists nvidia-smi; then
  # Try to get GPU information
  if GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null); then
    log_success "GPU detected: $GPU_INFO"
    echo "GPU detected: $GPU_INFO" > .devcontainer/logs/gpu-check.log

    # Check CUDA version
    if command_exists nvcc; then
      CUDA_VERSION=$(nvcc --version | grep "release" | awk '{print $5}' | cut -c2-)
      log_info "CUDA version: $CUDA_VERSION"
      echo "CUDA version: $CUDA_VERSION" >> .devcontainer/logs/gpu-check.log
    else
      log_warning "CUDA toolkit not found, but GPU is available"
      echo "CUDA toolkit not found, but GPU is available" >> .devcontainer/logs/gpu-check.log
    fi

    # Set environment variable for GPU availability
    echo "export TRANSFORMERS_JS_GPU_AVAILABLE=true" >> ~/.bashrc
    log_success "GPU is available for hardware acceleration"
  else
    log_warning "nvidia-smi command failed. GPU might not be accessible from container"
    echo "GPU not accessible from container" > .devcontainer/logs/gpu-check.log
  fi
else
  log_warning "No GPU detected. Using CPU for processing"
  echo "No GPU detected" > .devcontainer/logs/gpu-check.log
  # Set environment variable for GPU availability
  echo "export TRANSFORMERS_JS_GPU_AVAILABLE=false" >> ~/.bashrc
fi

# Create the device_map.json file
if grep -q "GPU detected" .devcontainer/logs/gpu-check.log 2>/dev/null; then
  log_info "Creating device_map.json for GPU acceleration..."
  mkdir -p .config
  cat > .config/device_map.json << EOF
{
  "model": "auto",
  "strategy": "auto"
}
EOF
else
  log_info "Creating device_map.json for CPU processing..."
  mkdir -p .config
  cat > .config/device_map.json << EOF
{
  "model": "cpu",
  "strategy": "sequential"
}
EOF
fi

log_success "GPU check completed"