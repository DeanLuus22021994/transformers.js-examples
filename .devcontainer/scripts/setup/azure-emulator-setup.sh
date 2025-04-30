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
