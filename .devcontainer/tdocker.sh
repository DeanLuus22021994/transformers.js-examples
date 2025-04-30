#!/bin/bash
# Host-container integration script for transformers.js-examples
# Provides seamless integration between the host and container environments

set -e

# Configuration
PROJECT_NAME="transformers-js-examples"
CONTAINER_NAME="${PROJECT_NAME}_dev_1"
COMPOSE_FILE=".devcontainer/docker-compose.yml"
SETUP_MARKER=".devcontainer/.setup-complete"
PRECOMPILE_MARKER=".devcontainer/.precompile-complete"
CONFIG_DIR=".devcontainer/config"

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

show_help() {
    echo "Transformers.js Docker Integration Tool"
    echo ""
    echo "Usage: $0 <command> [arguments]"
    echo ""
    echo "Commands:"
    echo "  status            Show container status"
    echo "  start             Start the containers"
    echo "  stop              Stop the containers"
    echo "  restart           Restart the containers"
    echo "  setup             Run setup script in container"
    echo "  check             Run readiness check in container"
    echo "  precompile        Force precompilation in container"
    echo "  exec <command>    Execute command in container"
    echo "  logs              Show container logs"
    echo "  gpu-check         Check GPU status in container"
    echo "  azure-check       Check Azure integration in container"
    echo "  optimize          Run volume and resource optimization"
    echo "  clean             Clean unnecessary files and optimize space"
    echo "  update            Update dependencies and cached models"
    echo "  test              Run specified tests in container"
    echo ""
    echo "Examples:"
    echo "  $0 exec 'npm test'"
    echo "  $0 exec 'node examples/text-generation/index.js'"
    echo "  $0 start && $0 setup"
    echo ""
}

check_docker() {
    log_info "Checking Docker installation..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH."
    fi

    # Check if modern Docker Compose plugin or legacy docker-compose is available
    if docker compose version &> /dev/null; then
        log_info "Using Docker Compose plugin"
        DOCKER_COMPOSE="docker compose"
    elif command -v docker-compose &> /dev/null; then
        log_warning "Using legacy docker-compose command. Consider upgrading Docker."
        DOCKER_COMPOSE="docker-compose"
    else
        log_error "Neither Docker Compose plugin nor docker-compose CLI is installed."
    fi

    log_success "Docker is properly configured"
}

is_container_running() {
    docker ps -q --filter "name=$CONTAINER_NAME" &> /dev/null
    return $?
}

check_container_exists() {
    docker container inspect "$CONTAINER_NAME" &> /dev/null
    return $?
}

start_containers() {
    log_info "Starting containers..."

    # Create the volumes directory if it doesn't exist
    if [ ! -d ".devcontainer/volumes" ]; then
        mkdir -p .devcontainer/volumes/{node_modules,precompiled,cache,config} 2>/dev/null || true
    fi

    # Check if container already exists and is running
    if check_container_exists; then
        if is_container_running; then
            log_info "Containers already running."
            return 0
        else
            log_info "Container exists but is not running. Starting..."
            $DOCKER_COMPOSE -f $COMPOSE_FILE start
        fi
    else
        log_info "Creating and starting containers..."
        $DOCKER_COMPOSE -f $COMPOSE_FILE up -d
    fi

    if [ $? -eq 0 ]; then
        log_success "Containers started successfully!"
    else
        log_error "Failed to start containers."
    fi

    # Wait a moment for the container to initialize
    log_info "Waiting for container to initialize..."
    sleep 2
}

stop_containers() {
    log_info "Stopping containers..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE stop

    if [ $? -eq 0 ]; then
        log_success "Containers stopped successfully!"
    else
        log_error "Failed to stop containers."
    fi
}

restart_containers() {
    log_info "Restarting containers..."
    $DOCKER_COMPOSE -f $COMPOSE_FILE restart

    if [ $? -eq 0 ]; then
        log_success "Containers restarted successfully!"
    else
        log_error "Failed to restart containers."
    fi

    # Wait for container to be fully ready
    sleep 2
}

get_container_status() {
    log_info "Container status:"
    $DOCKER_COMPOSE -f $COMPOSE_FILE ps
}

execute_in_container() {
    if [ -z "$1" ]; then
        log_error "No command specified to execute in container"
    fi

    if ! is_container_running; then
        log_warning "Container is not running. Starting..."
        start_containers
    fi

    log_info "Executing in container: $1"
    docker exec -it $CONTAINER_NAME bash -c "$1"
    return $?
}

run_setup() {
    log_info "Running setup in container..."

    # Check if the container is running
    if ! is_container_running; then
        log_info "Container is not running. Starting it first..."
        start_containers
    fi

    # Run the setup script
    execute_in_container "bash .devcontainer/scripts/setup/init.sh"
    local result=$?

    if [ $result -eq 0 ]; then
        # Mark setup as complete
        execute_in_container "touch $SETUP_MARKER"
        log_success "Setup completed successfully"
    else
        log_error "Setup failed with exit code $result"
    fi
}

run_readiness_check() {
    log_info "Running readiness checks..."
    execute_in_container "bash .devcontainer/scripts/checks/readiness.sh"

    local result=$?
    if [ $result -eq 0 ]; then
        log_success "Environment is ready!"
    else
        log_warning "Readiness check failed. Run setup first with './tdocker.sh setup'"
        return $result
    fi
}

force_precompile() {
    log_info "Forcing precompilation..."
    execute_in_container "FORCE_PRECOMPILE=1 bash .devcontainer/scripts/precompile/trigger.sh"

    if [ $? -eq 0 ]; then
        execute_in_container "touch $PRECOMPILE_MARKER"
        log_success "Precompilation completed successfully!"
    else
        log_error "Precompilation failed"
    fi
}

show_logs() {
    log_info "Container logs:"
    docker logs $CONTAINER_NAME
}

check_gpu() {
    log_info "Checking GPU status in container..."
    execute_in_container "bash .devcontainer/scripts/checks/gpu-check.sh"

    # Display result from GPU check
    execute_in_container "cat .devcontainer/logs/gpu-check.log 2>/dev/null || echo 'No GPU check log found'"
}

check_azure_integration() {
    log_info "Checking Azure integration..."
    execute_in_container "bash .devcontainer/scripts/checks/azure-check.sh"

    if [ $? -eq 0 ]; then
        log_success "Azure integration is properly configured"
    else
        log_warning "Azure integration check failed. You may need to log in or configure Azure services."
    fi
}

optimize_resources() {
    log_info "Optimizing container resources..."
    execute_in_container "bash .devcontainer/scripts/maintenance/optimize_resources.sh"

    if [ $? -eq 0 ]; then
        log_success "Resource optimization completed successfully!"
    else
        log_warning "Resource optimization completed with warnings"
    fi
}

clean_workspace() {
    log_info "Cleaning workspace..."
    execute_in_container "bash .devcontainer/scripts/maintenance/clean_workspace.sh"

    if [ $? -eq 0 ]; then
        log_success "Workspace cleaned successfully!"
    else
        log_warning "Workspace cleaning completed with warnings"
    fi
}

update_dependencies() {
    log_info "Updating dependencies and cached models..."
    execute_in_container "bash .devcontainer/scripts/maintenance/update.sh"

    if [ $? -eq 0 ]; then
        log_success "Dependencies and models updated successfully!"
    else
        log_warning "Update completed with warnings"
    fi
}

run_tests() {
    local test_type=$1

    case "$test_type" in
        all)
            log_info "Running all tests..."
            execute_in_container "npm test"
            ;;
        gpu)
            log_info "Running GPU tests..."
            execute_in_container "npm run test:gpu"
            ;;
        no-gpu)
            log_info "Running non-GPU tests..."
            execute_in_container "npm run test:no-gpu"
            ;;
        coverage)
            log_info "Running tests with coverage..."
            execute_in_container "npm run test:coverage"
            ;;
        *)
            log_error "Unknown test type: $test_type. Available options: all, gpu, no-gpu, coverage"
            ;;
    esac

    if [ $? -eq 0 ]; then
        log_success "Tests completed successfully!"
    else
        log_warning "Tests completed with failures"
    fi
}

# Main script execution
check_docker

# Handle command line arguments
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

case "$1" in
    status)
        get_container_status
        ;;
    start)
        start_containers
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    setup)
        run_setup
        ;;
    check)
        run_readiness_check
        ;;
    precompile)
        force_precompile
        ;;
    exec)
        if [ -z "$2" ]; then
            log_error "Missing command to execute"
        fi
        shift
        execute_in_container "$*"
        ;;
    logs)
        show_logs
        ;;
    gpu-check)
        check_gpu
        ;;
    azure-check)
        check_azure_integration
        ;;
    optimize)
        optimize_resources
        ;;
    clean)
        clean_workspace
        ;;
    update)
        update_dependencies
        ;;
    test)
        if [ -z "$2" ]; then
            run_tests "all"
        else
            run_tests "$2"
        fi
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        ;;
esac

exit 0