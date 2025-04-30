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
