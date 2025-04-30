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
