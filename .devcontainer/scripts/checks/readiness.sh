#!/bin/bash
set -e

# Import common utilities and logging
source .devcontainer/scripts/utils/common.sh
source .devcontainer/scripts/utils/logging.sh

log_step "Checking development environment readiness..."

# Check setup completion
if [ ! -f ".devcontainer/.setup-complete" ]; then
  log_error "Initial setup has not completed. Please run the setup script first."
  exit 1
fi

# Check Node.js
if ! command_exists node; then
  log_error "Node.js is not installed or not in PATH"
  exit 1
else
  NODE_VERSION=$(node --version)
  log_info "Node.js version: $NODE_VERSION"
fi

# Check npm dependencies
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  log_warning "npm dependencies are not installed. Installing now..."
  npm install
fi

# Check Azure CLI
if ! command_exists az; then
  log_error "Azure CLI is not installed"
  exit 1
else
  AZ_VERSION=$(az --version | head -n 1)
  log_info "Azure CLI version: $AZ_VERSION"
fi

# Check Azure login status
log_info "Checking Azure login status..."
if ! is_azure_logged_in; then
  log_warning "Not logged in to Azure. Running Azure login script..."
  bash .devcontainer/scripts/setup/azure-login.sh
fi

# Check Azurite container
log_info "Checking Azurite container status..."
if docker-compose ps azurite | grep -q "Up"; then
  log_success "Azurite container is running"
else
  log_warning "Azurite container is not running. Attempting to start..."
  docker-compose up -d azurite
fi

# Check if Azure solution insight service is set up
if [ ! -f ".vscode/extensions/dev-debt-processor/services/azure-solution-insight.js" ]; then
  log_warning "Azure solution insight service is not set up. Setting up now..."
  mkdir -p .vscode/extensions/dev-debt-processor/services

  # Create the service file from template
  if [ -f ".devcontainer/scripts/templates/azure-solution-insight.js.template" ]; then
    cp .devcontainer/scripts/templates/azure-solution-insight.js.template \
       .vscode/extensions/dev-debt-processor/services/azure-solution-insight.js
  else
    # Create a basic service file
    cat > .vscode/extensions/dev-debt-processor/services/azure-solution-insight.js << EOF
const vscode = require('vscode');

/**
 * Azure Solution Insight Service
 * Provides traceability and oversight analytics using Azure services
 */
class AzureSolutionInsightService {
    constructor(configManager, logger) {
        this.configManager = configManager;
        this.logger = logger;
        this.isInitialized = false;
    }

    async initialize() {
        this.logger.info('Azure Solution Insight Service initialized');
        this.isInitialized = true;
        return true;
    }
}

module.exports = AzureSolutionInsightService;
EOF
  fi
fi

# Check if required npm packages for Azure development are installed
for package in "@azure/identity" "@azure/monitor-query" "@azure/storage-blob"; do
  if ! npm list $package --depth=0 &> /dev/null; then
    log_warning "$package is not installed. Installing now..."
    npm install $package
  fi
done

# All checks passed
log_success "Development environment is ready for use!"
exit 0