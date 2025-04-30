#!/bin/bash

# GPU-aware test runner for transformers.js-examples
# This script runs tests using the appropriate Docker container based on GPU availability

set -e

# Base directory
BASE_DIR=$(pwd)
echo "Working directory: $BASE_DIR"

# Check if we have a GPU configuration file
if [ -f "$BASE_DIR/.env.gpu" ]; then
    source "$BASE_DIR/.env.gpu"
else
    # Default to no GPU if we can't determine
    HAS_GPU=false
    GPU_MEM_GB=0
    CAN_RUN_WEBGPU=false
fi

# Check for active test configuration
if [ -f "$BASE_DIR/.active-test-config" ]; then
    TEST_CONFIG=$(cat "$BASE_DIR/.active-test-config")
else
    # Default to non-GPU tests
    TEST_CONFIG="test-no-gpu"
fi

# Parse command line arguments
RUN_ALL=false
SPECIFIC_TEST=""
COVERAGE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            RUN_ALL=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --test=*)
            SPECIFIC_TEST="${1#*=}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--all] [--coverage] [--test=test-name]"
            exit 1
            ;;
    esac
done

echo "Running tests with configuration: $TEST_CONFIG"
echo "GPU available: $HAS_GPU"
echo "GPU memory: ${GPU_MEM_GB}GB"
echo "WebGPU supported: $CAN_RUN_WEBGPU"
echo ""

# Determine which tests to run
if [ -n "$SPECIFIC_TEST" ]; then
    # Run a specific test
    echo "Running specific test: $SPECIFIC_TEST"

    if [[ "$SPECIFIC_TEST" == *"webgpu"* ]] && [ "$CAN_RUN_WEBGPU" != "true" ]; then
        echo "⚠️ Warning: Running a WebGPU test but GPU resources are insufficient."
        echo "Test may fail or be skipped."
    fi

    TEST_CMD="npm run test:$SPECIFIC_TEST"

elif [ "$RUN_ALL" = "true" ]; then
    # Run all tests
    echo "Running all applicable tests"

    if [ "$HAS_GPU" = "true" ]; then
        TEST_CMD="npm run test"
    else
        TEST_CMD="npm run test:no-gpu"
    fi

else
    # Default: run non-WebGPU tests
    echo "Running default test suite (non-WebGPU tests)"
    TEST_CMD="npm run test:no-gpu"
fi

# Add coverage if requested
if [ "$COVERAGE" = "true" ]; then
    TEST_CMD="$TEST_CMD -- --coverage"
    echo "Generating test coverage"
fi

# Run the tests in the appropriate container
echo "Executing: $TEST_CMD"
echo ""

docker-compose -f docker-compose.test.yml run $TEST_CONFIG $TEST_CMD

echo ""
echo "Tests completed."
