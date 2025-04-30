#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Setting up git submodules..."

# Initialize and update submodules
git submodule update --init --recursive

log_success "Git submodules setup complete!"
