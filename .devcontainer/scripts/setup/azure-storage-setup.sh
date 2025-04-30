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
