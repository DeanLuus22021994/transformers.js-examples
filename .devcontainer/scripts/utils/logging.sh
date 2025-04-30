#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create log directory if it doesn't exist
mkdir -p .devcontainer/logs

# Log file
LOG_FILE=".devcontainer/logs/setup-$(date +%Y%m%d-%H%M%S).log"

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_step() {
  echo -e "\n${GREEN}==>${NC} $1" | tee -a "$LOG_FILE"
}

log_debug() {
  if [ "${DEBUG:-false}" = "true" ]; then
    echo -e "[DEBUG] $1" >> "$LOG_FILE"
  fi
}