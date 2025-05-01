#!/bin/bash
# BASH_ID::ENTRYPOINT
# filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\entrypoint.sh
# BASH_META::DESCRIPTION
# Entrypoint script for technical debt management container with RTX acceleration
# BASH_META::VERSION
# Version: 1.1.0
# BASH_META::AUTHOR
# Author: Transformers.js Team

# BASH_FUNCTION::CHECK_ENV
# Check environment and output system information
check_environment() {
  echo "=========================================="
  echo "Technical Debt Management System"
  echo "Initializing environment..."
  echo "=========================================="

  # Check if running as root
  if [ "$(id -u)" = "0" ]; then
    echo "Running as root"
  else
    echo "Running as $(id -un)"
  fi

  # Output basic system info
  echo "System information:"
  echo "- Hostname: $(hostname)"
  echo "- CPU: $(grep "model name" /proc/cpuinfo | head -n 1 | cut -d ":" -f 2 | sed 's/^[ \t]*//')"
  echo "- CPU Cores: $(grep -c "processor" /proc/cpuinfo)"
  echo "- Memory: $(free -h | grep "Mem:" | awk '{print $2}')"

  # Check for NVIDIA GPU
  if [ -x "$(command -v nvidia-smi)" ]; then
    echo "- NVIDIA GPU detected"
    echo "- GPU Information:"
    nvidia-smi --query-gpu=name,driver_version,memory.total,compute_mode --format=csv,noheader

    # Set environment variable to indicate GPU is available
    export DEBT_GPU_AVAILABLE=true
    export CUDA_VISIBLE_DEVICES=all
  else
    echo "- No NVIDIA GPU detected, will use CPU mode"
    export DEBT_GPU_AVAILABLE=false
  fi

  # Check Python environment
  echo "- Python version: $(python3 --version)"

  # Check Node.js environment
  echo "- Node.js version: $(node --version)"
  echo "- NPM version: $(npm --version)"

  echo "=========================================="
}

# BASH_FUNCTION::SETUP_DIRS
# Setup required directories
setup_directories() {
  echo "Setting up directories..."

  # Create config directory if it doesn't exist
  mkdir -p /app/config

  # Create model cache directory if it doesn't exist
  mkdir -p /app/model-cache

  # Create debt reports directory if it doesn't exist
  mkdir -p /app/debt-reports

  # Create cache directories
  mkdir -p /cache/uv
  mkdir -p /cache/pip
  mkdir -p /cache/npm
  mkdir -p /cache/pycache

  # Set appropriate permissions
  chmod -R 777 /app/debt-reports
  chmod -R 777 /app/model-cache
  chmod -R 777 /cache

  echo "Directories setup complete"
}

# BASH_FUNCTION::COPY_DEFAULTS
# Copy default configuration files if they don't exist
copy_defaults() {
  echo "Checking for configuration files..."

  # Copy default config if it doesn't exist
  if [ ! -f "/app/config/debt-config.yml" ]; then
    echo "Copying default configuration..."
    cp /app/defaults/debt-config.yml /app/config/
  else
    echo "Configuration file exists, skipping"
  fi

  echo "Configuration check complete"
}

# BASH_FUNCTION::OPTIMIZE_FOR_GPU
# Optimize settings for GPU if available
optimize_for_gpu() {
  if [ "$DEBT_GPU_AVAILABLE" = true ]; then
    echo "Optimizing settings for GPU..."

    # Set PyTorch to use GPU
    export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128

    # Set environment variables for transformers
    export TRANSFORMERS_CACHE=/app/model-cache
    export TRANSFORMERS_OFFLINE=0
    export CUDA_LAUNCH_BLOCKING=0

    # Initialize model cache with optimized parameters
    echo "Preloading model to optimize performance..."

    # Enable JIT compilation for model
    python3 -c "
import torch
import os
import sys
from transformers import AutoModelForCausalLM, AutoTokenizer

try:
    print('Initializing model with GPU optimization...')
    model_id = 'HuggingFaceTB/SmolLM2-1.7B-intermediate-checkpoints'
    revision = 'step-125000'
    cache_dir = '/app/model-cache'

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision, cache_dir=cache_dir)

    # Load model with GPU optimizations
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        revision=revision,
        cache_dir=cache_dir,
        torch_dtype=torch.float16,
        device_map='auto',
        low_cpu_mem_usage=True
    )

    # Check if CUDA is available
    if torch.cuda.is_available():
        print(f'CUDA is available: {torch.cuda.get_device_name(0)}')

        # Apply JIT compilation for faster inference
        print('Optimizing model with JIT compilation...')
        example_input = tokenizer('This is a test input for optimization', return_tensors='pt').to('cuda')

        with torch.inference_mode(), torch.cuda.amp.autocast():
            # Trace the model for faster inference
            traced_model = torch.jit.trace(model, example_input['input_ids'])

        # Save optimized model
        torch.jit.save(traced_model, '/app/model-cache/optimized_model_cuda.pt')
        print('Saved optimized CUDA model')

        # Test inference
        print('Testing optimized model...')
        test_input = tokenizer('Analyze this code for technical debt issues:', return_tensors='pt').to('cuda')

        with torch.inference_mode():
            outputs = traced_model.generate(
                test_input['input_ids'],
                max_length=50,
                temperature=0.7,
                top_p=0.9,
                do_sample=True
            )

        print('Model optimization complete!')
        sys.exit(0)
    else:
        print('CUDA is not available, skipping JIT optimization')
        sys.exit(1)
except Exception as e:
    print(f'Error during model optimization: {e}')
    sys.exit(1)
"

    # Check the result
    if [ $? -eq 0 ]; then
      echo "GPU optimization completed successfully"
    else
      echo "GPU optimization failed, will use standard configuration"
    fi
  else
    echo "No GPU detected, skipping GPU optimization"
  fi
}

# BASH_FUNCTION::RUN_HEALTH_CHECK
# Run health check script
run_health_check() {
  echo "Running health check..."
  node /app/scripts/health-check.js

  # Check if health check passed
  if [ $? -eq 0 ]; then
    echo "Health check passed"
    return 0
  else
    echo "Health check warnings or errors detected"
    return 1
  fi
}

# BASH_FUNCTION::MAIN
# Main entrypoint function
main() {
  echo "Starting Technical Debt Management System..."

  # Check environment
  check_environment

  # Setup directories
  setup_directories

  # Copy default configuration files
  copy_defaults

  # Optimize for GPU if available
  if [ "$DEBT_GPU_AVAILABLE" = true ]; then
    optimize_for_gpu
  fi

  # Run health check
  run_health_check

  echo "Technical Debt Management System initialization complete!"

  # Start the service based on command
  case "$1" in
    analyze)
      shift
      echo "Running analysis on files: $@"
      node /app/scripts/debt-assistant.js analyze "$@"
      ;;
    report)
      echo "Generating debt report"
      node /app/scripts/debt-assistant.js report
      ;;
    scorecard)
      echo "Generating debt scorecard"
      node /app/scripts/debt-scorecard.js generate
      ;;
    shell)
      echo "Starting interactive shell"
      /bin/bash
      ;;
    server)
      echo "Starting debt management server"
      # TODO: Implement server mode
      echo "Server mode not yet implemented"
      exit 1
      ;;
    *)
      echo "Running command: $@"
      exec "$@"
      ;;
  esac
}

# BASH_ACTION::RUN_MAIN
# Run main function with all arguments
main "$@"
