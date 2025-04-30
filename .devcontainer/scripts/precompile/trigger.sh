#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Triggering precompilation processes..."

# Check if precompilation is needed
if [ -f ".devcontainer/.precompile-complete" ] && [ -z "$FORCE_PRECOMPILE" ]; then
  log_info "Precompilation already completed. Skipping..."
  log_info "To force precompilation, set FORCE_PRECOMPILE=1"
  exit 0
fi

# Create a device_map.json file for hardware acceleration if available
if grep -q "GPU detected" .devcontainer/logs/gpu-check.log 2>/dev/null; then
  log_info "GPU detected, configuring for hardware acceleration..."
  cat > device_map.json << EOF
{
  "model": "auto",
  "strategy": "auto"
}
EOF
else
  log_info "No GPU detected, using CPU configuration..."
  cat > device_map.json << EOF
{
  "model": "cpu",
  "strategy": "sequential"
}
EOF
fi

# Precompile Azure solution insight service templates
log_info "Precompiling Azure templates..."
mkdir -p .vscode/extensions/dev-debt-processor/services/templates
cat > .vscode/extensions/dev-debt-processor/services/templates/azure-service.js.tpl << EOF
// This is a precompiled template for Azure services
const AzureStorageClient = require('@azure/storage-blob');
const AzureMonitorClient = require('@azure/monitor-query');

class AzureServiceTemplate {
  constructor(config) {
    this.config = config;
    this.clients = {};
  }

  async initialize() {
    // Initialize Azure clients
    return true;
  }

  // Additional template methods would go here
}

module.exports = AzureServiceTemplate;
EOF

# Run any necessary precompilation build steps
if [ -f "package.json" ]; then
  if grep -q "\"precompile\"" package.json; then
    log_info "Running npm precompile script..."
    npm run precompile
  fi
fi

# Run Azure integration tests to verify setup
log_info "Verifying Azure integration..."
bash .devcontainer/scripts/checks/azure-check.sh

# Mark precompilation as complete
echo "$(date)" > .devcontainer/.precompile-complete
log_success "Precompilation completed successfully!"