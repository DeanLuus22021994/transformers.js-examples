#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Starting development environment setup..."

# Create necessary directories
mkdir -p .devcontainer/logs
mkdir -p .vscode/extensions/dev-debt-processor/services
mkdir -p test/services

# Create template directory if missing
mkdir -p .devcontainer/scripts/templates

# Create missing scripts directory if not exist
mkdir -p .devcontainer/scripts/setup

# Create submodules.sh script if not exists
if [ ! -f ".devcontainer/scripts/setup/submodules.sh" ]; then
  log_info "Creating submodules.sh script..."
  cat > .devcontainer/scripts/setup/submodules.sh << 'EOF'
#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Setting up git submodules..."

# Initialize and update submodules
git submodule update --init --recursive

log_success "Git submodules setup complete!"
EOF
  chmod +x .devcontainer/scripts/setup/submodules.sh
fi

# Create dependencies.sh script if not exists
if [ ! -f ".devcontainer/scripts/setup/dependencies.sh" ]; then
  log_info "Creating dependencies.sh script..."
  cat > .devcontainer/scripts/setup/dependencies.sh << 'EOF'
#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Installing dependencies..."

# Install npm dependencies if package.json exists
if [ -f "package.json" ]; then
  log_info "Installing npm packages..."
  npm install
fi

log_success "Dependencies installed successfully!"
EOF
  chmod +x .devcontainer/scripts/setup/dependencies.sh
fi

# Create azure-login.sh script if not exists
if [ ! -f ".devcontainer/scripts/setup/azure-login.sh" ]; then
  log_info "Creating azure-login.sh script..."
  cat > .devcontainer/scripts/setup/azure-login.sh << 'EOF'
#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Handling Azure login..."

# Check if already logged in
if is_azure_logged_in; then
  log_success "Already logged in to Azure"
  exit 0
fi

# Try device code login
log_info "Logging in to Azure using device code flow..."
az login --use-device-code

# Check if login was successful
if is_azure_logged_in; then
  log_success "Azure login successful"
else
  log_error "Azure login failed"
  exit 1
fi
EOF
  chmod +x .devcontainer/scripts/setup/azure-login.sh
fi

# Create azure-storage-setup.sh script if not exists
if [ ! -f ".devcontainer/scripts/setup/azure-storage-setup.sh" ]; then
  log_info "Creating azure-storage-setup.sh script..."
  cat > .devcontainer/scripts/setup/azure-storage-setup.sh << 'EOF'
#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Setting up Azure Storage..."

# Load settings
if [ -f ".devcontainer/config/azure-settings.json" ]; then
  RESOURCE_GROUP=$(jq -r '.resourceGroup' .devcontainer/config/azure-settings.json)
  STORAGE_ACCOUNT=$(jq -r '.storageAccount' .devcontainer/config/azure-settings.json)
  LOCATION=$(jq -r '.location' .devcontainer/config/azure-settings.json)
else
  # Default values if config file doesn't exist
  RESOURCE_GROUP="dev-debt-rg"
  STORAGE_ACCOUNT="devdebtstorage$RANDOM"
  LOCATION="eastus"
fi

# Skip resource creation in container, just use connection strings
log_info "Using local Azurite storage emulator for development"

# Set environment variable for Azurite connection string
CONN_STRING="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;"

# Export the connection string
echo "export AZURE_STORAGE_CONNECTION_STRING=\"$CONN_STRING\"" >> ~/.bashrc

log_success "Azure Storage setup complete!"
EOF
  chmod +x .devcontainer/scripts/setup/azure-storage-setup.sh
fi

# Create azure-emulator-setup.sh script if not exists
if [ ! -f ".devcontainer/scripts/setup/azure-emulator-setup.sh" ]; then
  log_info "Creating azure-emulator-setup.sh script..."
  cat > .devcontainer/scripts/setup/azure-emulator-setup.sh << 'EOF'
#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Setting up Azure Emulators..."

# Wait for Azurite to be available
wait_for_service azurite 10000 60
log_success "Azurite Blob service is available"

wait_for_service azurite 10001 30
log_success "Azurite Queue service is available"

wait_for_service azurite 10002 30
log_success "Azurite Table service is available"

log_success "Azure emulators setup complete!"
EOF
  chmod +x .devcontainer/scripts/setup/azure-emulator-setup.sh
fi

# Create azure-check.sh script if not exists
if [ ! -f ".devcontainer/scripts/checks/azure-check.sh" ]; then
  log_info "Creating azure-check.sh script..."
  mkdir -p .devcontainer/scripts/checks
  cat > .devcontainer/scripts/checks/azure-check.sh << 'EOF'
#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Verifying Azure integration..."

# Check if we can connect to Azurite
log_info "Testing connection to Azurite Blob service..."
if wait_for_service azurite 10000 5; then
  log_success "Azurite Blob service is available"
else
  log_warning "Azurite Blob service is not available"
fi

# Check Azure CLI
if command_exists az; then
  log_success "Azure CLI is installed"
else
  log_warning "Azure CLI is not installed properly"
fi

log_info "Azure integration verification complete"
EOF
  chmod +x .devcontainer/scripts/checks/azure-check.sh
fi

# Create missing gpu-check.sh script if not exists
if [ ! -f ".devcontainer/scripts/checks/gpu-check.sh" ]; then
  log_info "Creating gpu-check.sh script..."
  mkdir -p .devcontainer/scripts/checks
  cat > .devcontainer/scripts/checks/gpu-check.sh << 'EOF'
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
EOF
  chmod +x .devcontainer/scripts/checks/gpu-check.sh
fi

# Setup git submodules
if [ -f ".devcontainer/scripts/setup/submodules.sh" ]; then
  log_info "Setting up git submodules..."
  bash .devcontainer/scripts/setup/submodules.sh
fi

# Install dependencies
log_info "Installing npm dependencies..."
bash .devcontainer/scripts/setup/dependencies.sh

# Set up Azure development environment
log_info "Setting up Azure development tools..."
bash .devcontainer/scripts/setup/azure-setup.sh

# Check for GPU support
log_info "Checking GPU support..."
bash .devcontainer/scripts/checks/gpu-check.sh

# Copy over templates from setup-test-data.sh if available
if [ -f ".devcontainer/scripts/setup-test-data.sh" ]; then
  log_info "Setting up test data templates..."
  bash .devcontainer/scripts/setup-test-data.sh
fi

# Write setup completion marker
echo "$(date)" > .devcontainer/.setup-complete

log_success "Development environment setup complete!"