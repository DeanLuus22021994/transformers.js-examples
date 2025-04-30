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
