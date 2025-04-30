#!/bin/bash
# Setup script for Technical Debt Scanner
# This runs after the container is created to set up the debt scanner

echo "Setting up Technical Debt Scanner..."

# Create directories if they don't exist
mkdir -p .github/debt-management/scripts
mkdir -p .github/debt-management/workflows
mkdir -p .github/debt-management/templates
mkdir -p .github/debt-management/config
mkdir -p .github/debt-management/docker
mkdir -p debt-reports

# Copy files if they don't exist (to avoid overwriting)
if [ ! -f ".github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE.md" ]; then
  cp .github/instructions/format_dev_debt_docs.instructions.md .github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE.md
fi

# Install required tools for debt scanning
apt-get update && apt-get install -y bc python3 python3-pip python3-yaml && apt-get clean
pip3 install tabulate colorama

# Set permissions for scripts
if [ -d ".github/debt-management/scripts" ]; then
  chmod +x .github/debt-management/scripts/*.sh 2>/dev/null || true
fi

echo "Technical Debt Scanner setup complete"
