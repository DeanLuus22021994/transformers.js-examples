#!/bin/bash
# SCRIPT_ID::ENTRYPOINT
# filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\entrypoint.sh
# SCRIPT_META::DESCRIPTION
# Container entrypoint script that initializes the RTX-accelerated debt management assistant
# SCRIPT_META::VERSION
# Version: 1.1.0
# SCRIPT_META::AUTHOR
# Author: Transformers.js Team

# SCRIPT_CONFIG::ERROR_HANDLING
set -e

# SCRIPT_FUNCTION::LOG
# Function to log messages with timestamps
log() {
  local level=$1
  shift
  echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $*"
}

# SCRIPT_ACTION::WELCOME
log "INFO" "Starting RTX-Accelerated Debt Management Assistant container"
log "INFO" "Model cache directory: $MODEL_CACHE_DIR"

# SCRIPT_ACTION::CHECK_CUDA
# Check for CUDA and GPU availability
if command -v nvidia-smi &> /dev/null; then
  log "INFO" "NVIDIA GPU detected, checking details..."
  nvidia-smi

  # Check if PyTorch can access the GPU
  python3 -c "
import torch
if torch.cuda.is_available():
    device_count = torch.cuda.device_count()
    log_msg = f'PyTorch detected {device_count} CUDA device(s)'
    for i in range(device_count):
        log_msg += f\"\\n  - GPU {i}: {torch.cuda.get_device_name(i)}\"
    print(log_msg)
    # Set CUDA optimization flags
    torch.backends.cudnn.benchmark = True
    torch.backends.cuda.matmul.allow_tf32 = True
    print('CUDA optimizations enabled')
else:
    print('WARNING: PyTorch cannot access CUDA. Check your installation')
"
else
  log "WARN" "NVIDIA GPU not detected, falling back to CPU mode (slower performance)"
  export CUDA_VISIBLE_DEVICES=""
fi

# SCRIPT_ACTION::SETUP_CACHE
# Setup cache directories for improved performance
for cache_dir in "$UV_CACHE_DIR" "$PIP_CACHE_DIR" "$NPM_CONFIG_CACHE" "$PYTHONPYCACHEPREFIX"; do
  if [ ! -d "$cache_dir" ]; then
    log "INFO" "Creating cache directory: $cache_dir"
    mkdir -p "$cache_dir"
    chmod 777 "$cache_dir"
  fi
done

# SCRIPT_ACTION::CHECK_MODEL
# Verify model files and optimized version exist
if [ ! -d "$MODEL_CACHE_DIR" ] || [ -z "$(ls -A $MODEL_CACHE_DIR)" ]; then
  log "WARN" "Model cache not found or empty, will download on first use (this may take some time)"
elif [ -f "$MODEL_CACHE_DIR/optimized_model_cuda.pt" ]; then
  log "INFO" "Found optimized GPU model, will use for acceleration"
else
  log "INFO" "Optimized GPU model not found, using standard model"
fi

# SCRIPT_ACTION::CHECK_CONFIG
# Check for configuration files
if [ ! -f "/app/config/debt-config.yml" ]; then
  log "INFO" "Configuration not found, copying default config"
  mkdir -p /app/config
  cp /app/defaults/debt-config.yml /app/config/
fi

# SCRIPT_ACTION::SETUP_REPORTS_DIR
# Set up reports directory
mkdir -p /app/debt-reports

# SCRIPT_ACTION::PRELOAD_MODEL
# Preload model for faster first inference if CUDA is available
if [ -f "$MODEL_CACHE_DIR/optimized_model_cuda.pt" ] && python3 -c "import torch; exit(0 if torch.cuda.is_available() else 1)" &> /dev/null; then
  log "INFO" "Preloading optimized model into GPU memory..."
  python3 -c "
import torch
import os
import gc
try:
    # Force garbage collection first
    gc.collect()
    torch.cuda.empty_cache()

    # Load the optimized model
    model_path = os.path.join('${MODEL_CACHE_DIR}', 'optimized_model_cuda.pt')
    model = torch.jit.load(model_path)
    model = model.to('cuda')

    # Run a small inference to ensure everything is loaded
    test_input = torch.ones(1, 10, dtype=torch.long).to('cuda')
    with torch.inference_mode(), torch.cuda.amp.autocast():
        _ = model(test_input)

    print('Model successfully preloaded into GPU memory')
except Exception as e:
    print(f'Error preloading model: {e}')
"
fi

# SCRIPT_ACTION::EXEC
# Execute the provided command
log "INFO" "Executing command: $*"
exec "$@"

# SCRIPT_ID::FOOTER
# SchemaVersion: 1.0.0
# ScriptID: container-entrypoint
