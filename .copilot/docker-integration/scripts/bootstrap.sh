#!/usr/bin/env bash

# Bash script to bootstrap the Docker integration for transformers.js
# This script runs when a terminal is opened in VS Code

# ANSI colors for output
RESET="\033[0m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"

# Function to output colored text
print_color() {
  echo -e "${2}${1}${RESET}"
}

# Show welcome message
print_color "🐳 Transformers.js Docker Integration" "$CYAN"
print_color "Initializing Docker environment..." "$BLUE"

# Check if Docker is available
if ! docker version > /dev/null 2>&1; then
  print_color "Docker is not running. Please start Docker Desktop or Docker daemon." "$YELLOW"
  exit 1
else
  DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null || docker version | grep 'Server version' | awk '{print $3}')
  print_color "✅ Docker is running (version $DOCKER_VERSION)" "$GREEN"
fi

# Define paths
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INTEGRATION_DIR="${ROOT_DIR}/.copilot/docker-integration"
CLI_PATH="${INTEGRATION_DIR}/dist/cli.js"

# Check if integration is built
if [ ! -f "$CLI_PATH" ]; then
  print_color "Building Docker integration..." "$BLUE"
  pushd "$INTEGRATION_DIR" > /dev/null
  npm install
  npm run build
  popd > /dev/null
fi

# Start the integration in the background
print_color "Starting Docker integration services..." "$BLUE"

# Run the integration CLI
if node "$CLI_PATH" start --silent; then
  print_color "✅ Docker integration initialized successfully" "$GREEN"
  print_color "Available commands:" "$CYAN"
  print_color "  - tdocker status    : Show status of Docker services" "$CYAN"
  print_color "  - tdocker start     : Start Docker services" "$CYAN"
  print_color "  - tdocker stop      : Stop Docker services" "$CYAN"
  print_color "  - tdocker restart   : Restart Docker services" "$CYAN"
  print_color "  - tdocker logs      : Show logs from Docker services" "$CYAN"
  print_color "  - tdocker cache     : Manage the model cache" "$CYAN"
  print_color "  - tdocker help      : Show help" "$CYAN"
else
  print_color "Failed to initialize Docker integration. Check logs for details." "$YELLOW"
fi

# Add the CLI to the path for this session
export PATH="${INTEGRATION_DIR}/bin:${PATH}"

# Create an alias for the CLI
alias tdocker="node ${CLI_PATH}"

# Check if there are example projects that need Docker
EXAMPLE_COUNT=$(find "$ROOT_DIR" -maxdepth 2 -name "docker-compose.yml" | wc -l)
if [ "$EXAMPLE_COUNT" -gt 0 ]; then
  print_color "Found $EXAMPLE_COUNT example(s) with Docker Compose configuration" "$BLUE"
fi
