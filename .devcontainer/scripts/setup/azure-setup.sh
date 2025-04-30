#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_info "Setting up Azure development environment..."

# Create directories
mkdir -p ~/.azure
mkdir -p ~/.config/azure
mkdir -p ~/azure-test-resources

# Load Azure configuration
if [ -f ".devcontainer/config/azure-settings.json" ]; then
  RESOURCE_GROUP=$(jq -r '.resourceGroup' .devcontainer/config/azure-settings.json)
  STORAGE_ACCOUNT=$(jq -r '.storageAccount' .devcontainer/config/azure-settings.json)
  LOCATION=$(jq -r '.location' .devcontainer/config/azure-settings.json)
else
  # Default values if config file doesn't exist
  RESOURCE_GROUP="transformers-js-examples-rg"
  STORAGE_ACCOUNT="transformersjsstorage$RANDOM"
  LOCATION="eastus"

  # Create config directory and file
  mkdir -p .devcontainer/config
  echo "{\"resourceGroup\":\"$RESOURCE_GROUP\",\"storageAccount\":\"$STORAGE_ACCOUNT\",\"location\":\"$LOCATION\"}" > .devcontainer/config/azure-settings.json
fi

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
  log_warning "Azure CLI is not installed. Installing..."
  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
fi

# Handle Azure login
bash .devcontainer/scripts/setup/azure-login.sh

# Setup Azure Storage
bash .devcontainer/scripts/setup/azure-storage-setup.sh

# Setup Azure Local Emulator
bash .devcontainer/scripts/setup/azure-emulator-setup.sh

# Define variables for Azure Log Analytics
WORKSPACE_ID="${AZURE_LOG_WORKSPACE_ID:-}"
WORKSPACE_KEY="${AZURE_LOG_KEY:-}"
CONN_STRING="${AZURE_STORAGE_CONNECTION_STRING:-DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;}"

# Export environment variables
log_info "Setting up Azure environment variables..."
echo "export AZURE_LOG_WORKSPACE_ID=\"$WORKSPACE_ID\"" >> ~/.bashrc
echo "export AZURE_LOG_KEY=\"$WORKSPACE_KEY\"" >> ~/.bashrc
echo "export AZURE_STORAGE_CONNECTION_STRING=\"$CONN_STRING\"" >> ~/.bashrc

# Create sample .env file
if [ ! -f ".env.example" ]; then
  log_info "Creating sample .env file with Azure connection information..."
  cat > .env.example << EOF
# Azure Connection Information
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

# For local development with Azurite
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;QueueEndpoint=http://azurite:10001/devstoreaccount1;TableEndpoint=http://azurite:10002/devstoreaccount1;
EOF
fi

log_success "Azure development environment setup complete!"