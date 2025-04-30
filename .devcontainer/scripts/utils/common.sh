#!/bin/bash

# Check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Check if a file exists and is not empty
file_exists_not_empty() {
  [ -s "$1" ]
}

# Load environment variables from file
load_env() {
  if [ -f "$1" ]; then
    export $(grep -v '^#' "$1" | xargs)
  fi
}

# Wait for a service to be ready
wait_for_service() {
  local host=$1
  local port=$2
  local timeout=${3:-30}

  echo "Waiting for $host:$port to be ready (timeout: ${timeout}s)..."

  for i in $(seq 1 $timeout); do
    if nc -z $host $port > /dev/null 2>&1; then
      echo "$host:$port is available"
      return 0
    fi
    sleep 1
  done

  echo "$host:$port is not available after ${timeout}s"
  return 1
}

# Check Azure CLI login status
is_azure_logged_in() {
  az account show &> /dev/null
}

# Execute with retry logic
retry() {
  local retries=$1
  shift
  local count=0
  until "$@"; do
    exit=$?
    count=$((count + 1))
    if [ $count -lt $retries ]; then
      echo "Command failed, retrying ($count/$retries)..."
      sleep 5
    else
      return $exit
    fi
  done
  return 0
}