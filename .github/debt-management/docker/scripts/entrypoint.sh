#!/bin/bash
# SCRIPT_ID::ENTRYPOINT
# filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\entrypoint.sh
# SCRIPT_META::DESCRIPTION
# Container entrypoint script that initializes the debt management assistant
# SCRIPT_META::VERSION
# Version: 1.0.0
# SCRIPT_META::AUTHOR
# Author: Transformers.js Team

# SCRIPT_CONFIG::ERROR_HANDLING
set -e

# SCRIPT_FUNCTION::LOG
# Function to log messages with timestamps
log() {
  local level=$1
  shift
  echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $*"
}

# SCRIPT_ACTION::WELCOME
log "INFO" "Starting Debt Management Assistant container"
log "INFO" "Model cache directory: $MODEL_CACHE_DIR"

# SCRIPT_ACTION::CHECK_MODEL
# Verify model files exist
if [ ! -d "$MODEL_CACHE_DIR" ] || [ -z "$(ls -A $MODEL_CACHE_DIR)" ]; then
  log "WARN" "Model cache not found or empty, will download on first use"
fi

# SCRIPT_ACTION::CHECK_CONFIG
# Check for configuration files
if [ ! -f "/app/config/debt-config.yml" ]; then
  log "INFO" "Configuration not found, copying default config"
  mkdir -p /app/config
  cp /app/defaults/debt-config.yml /app/config/
fi

# SCRIPT_ACTION::SETUP_REPORTS_DIR
# Set up reports directory
mkdir -p /app/debt-reports

# SCRIPT_ACTION::EXEC
# Execute the provided command
log "INFO" "Executing command: $*"
exec "$@"

# SCRIPT_ID::FOOTER
# SchemaVersion: 1.0.0
# ScriptID: container-entrypoint
