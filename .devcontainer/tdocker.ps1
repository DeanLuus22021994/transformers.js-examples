<#
.SYNOPSIS
    Host-container integration script for transformers.js-examples
.DESCRIPTION
    Provides seamless integration between the host and container environments
    allowing commands to be executed in the container from the host.
.EXAMPLE
    .\tdocker.ps1 start
    .\tdocker.ps1 exec "npm test"
    .\tdocker.ps1 gpu-check
#>

param (
	[Parameter(Position = 0)]
	[string]$Command,

	[Parameter(ValueFromRemainingArguments = $true)]
	[string[]]$Arguments
)

# Configuration
$PROJECT_NAME = "transformers-js-examples"
$CONTAINER_NAME = "${PROJECT_NAME}_dev_1"
$COMPOSE_FILE = ".devcontainer/docker-compose.yml"
$SETUP_MARKER = ".devcontainer/.setup-complete"
$PRECOMPILE_MARKER = ".devcontainer/.precompile-complete"
$CONFIG_DIR = ".devcontainer/config"

# ANSI color codes for PowerShell
$Green = [char]27 + "[32m"
$Yellow = [char]27 + "[33m"
$Red = [char]27 + "[31m"
$Blue = [char]27 + "[34m"
$Reset = [char]27 + "[0m"

# Logging functions
function Write-InfoLog {
	param([string]$Message)
	Write-Host "${Blue}[INFO]${Reset} $Message"
}

function Write-SuccessLog {
	param([string]$Message)
	Write-Host "${Green}[SUCCESS]${Reset} $Message"
}

function Write-WarningLog {
	param([string]$Message)
	Write-Host "${Yellow}[WARNING]${Reset} $Message"
}

function Write-ErrorLog {
	param([string]$Message)
	Write-Host "${Red}[ERROR]${Reset} $Message"
	exit 1
}

function Show-HelpInfo {
	Write-Host "Transformers.js Docker Integration Tool"
	Write-Host ""
	Write-Host "Usage: .\tdocker.ps1 <command> [arguments]"
	Write-Host ""
	Write-Host "Commands:"
	Write-Host "  status            Show container status"
	Write-Host "  start             Start the containers"
	Write-Host "  stop              Stop the containers"
	Write-Host "  restart           Restart the containers"
	Write-Host "  setup             Run setup script in container"
	Write-Host "  check             Run readiness check in container"
	Write-Host "  precompile        Force precompilation in container"
	Write-Host "  exec <command>    Execute command in container"
	Write-Host "  logs              Show container logs"
	Write-Host "  gpu-check         Check GPU status in container"
	Write-Host "  azure-check       Check Azure integration in container"
	Write-Host "  optimize          Run volume and resource optimization"
	Write-Host "  clean             Clean unnecessary files and optimize space"
	Write-Host "  update            Update dependencies and cached models"
	Write-Host "  test              Run specified tests in container"
	Write-Host ""
	Write-Host "Examples:"
	Write-Host "  .\tdocker.ps1 exec 'npm test'"
	Write-Host "  .\tdocker.ps1 exec 'node examples/text-generation/index.js'"
	Write-Host "  .\tdocker.ps1 start; .\tdocker.ps1 setup"
	Write-Host ""
}

function Confirm-DockerInstallation {
	Write-InfoLog "Checking Docker installation..."

	try {
		$null = docker --version
	}
	catch {
		Write-ErrorLog "Docker is not installed or not in PATH."
	}

	# Check if modern Docker Compose plugin or legacy docker-compose is available
	try {
		$null = docker compose version
		Write-InfoLog "Using Docker Compose plugin"
		$script:DockerCompose = "docker compose"
	}
	catch {
		try {
			$null = docker-compose --version
			Write-WarningLog "Using legacy docker-compose command. Consider upgrading Docker."
			$script:DockerCompose = "docker-compose"
		}
		catch {
			Write-ErrorLog "Neither Docker Compose plugin nor docker-compose CLI is installed."
		}
	}

	Write-SuccessLog "Docker is properly configured"
}

function Test-ContainerRunning {
	$containerId = docker ps -q --filter "name=$CONTAINER_NAME" 2>$null
	return $containerId -ne $null
}

function Test-ContainerExists {
	try {
		$null = docker container inspect "$CONTAINER_NAME" 2>$null
		return $true
	}
	catch {
		return $false
	}
}

function Start-Containers {
	Write-InfoLog "Starting containers..."

	# Create the volumes directory if it doesn't exist
	if (-not (Test-Path ".devcontainer/volumes")) {
		New-Item -Path ".devcontainer/volumes" -ItemType Directory -Force | Out-Null
		foreach ($dir in @("node_modules", "precompiled", "cache", "config")) {
			New-Item -Path ".devcontainer/volumes/$dir" -ItemType Directory -Force | Out-Null
		}
	}

	# Check if container already exists and is running
	if (Test-ContainerExists) {
		if (Test-ContainerRunning) {
			Write-InfoLog "Containers already running."
			return
		}
		else {
			Write-InfoLog "Container exists but is not running. Starting..."
			Invoke-Expression "$script:DockerCompose -f $COMPOSE_FILE start"
		}
	}
	else {
		Write-InfoLog "Creating and starting containers..."
		Invoke-Expression "$script:DockerCompose -f $COMPOSE_FILE up -d"
	}

	if ($LASTEXITCODE -eq 0) {
		Write-SuccessLog "Containers started successfully!"
	}
	else {
		Write-ErrorLog "Failed to start containers."
	}

	# Wait a moment for the container to initialize
	Write-InfoLog "Waiting for container to initialize..."
	Start-Sleep -Seconds 2
}

function Stop-Containers {
	Write-InfoLog "Stopping containers..."
	Invoke-Expression "$script:DockerCompose -f $COMPOSE_FILE stop"

	if ($LASTEXITCODE -eq 0) {
		Write-SuccessLog "Containers stopped successfully!"
	}
	else {
		Write-ErrorLog "Failed to stop containers."
	}
}

function Restart-Containers {
	Write-InfoLog "Restarting containers..."
	Invoke-Expression "$script:DockerCompose -f $COMPOSE_FILE restart"

	if ($LASTEXITCODE -eq 0) {
		Write-SuccessLog "Containers restarted successfully!"
	}
	else {
		Write-ErrorLog "Failed to restart containers."
	}

	# Wait for container to be fully ready
	Start-Sleep -Seconds 2
}

function Get-ContainerStatus {
	Write-InfoLog "Container status:"
	Invoke-Expression "$script:DockerCompose -f $COMPOSE_FILE ps"
}

function Invoke-ContainerCommand {
	param([string]$Command)

	if ([string]::IsNullOrEmpty($Command)) {
		Write-ErrorLog "No command specified to execute in container"
	}

	if (-not (Test-ContainerRunning)) {
		Write-WarningLog "Container is not running. Starting..."
		Start-Containers
	}

	Write-InfoLog "Executing in container: $Command"
	docker exec -it $CONTAINER_NAME bash -c $Command
	return $LASTEXITCODE
}

function Start-ContainerSetup {
	Write-InfoLog "Running setup in container..."

	# Check if the container is running
	if (-not (Test-ContainerRunning)) {
		Write-InfoLog "Container is not running. Starting it first..."
		Start-Containers
	}

	# Run the setup script
	Invoke-ContainerCommand "bash .devcontainer/scripts/setup/init.sh"
	$result = $LASTEXITCODE

	if ($result -eq 0) {
		# Mark setup as complete
		Invoke-ContainerCommand "touch $SETUP_MARKER"
		Write-SuccessLog "Setup completed successfully"
	}
	else {
		Write-ErrorLog "Setup failed with exit code $result"
	}
}

function Test-ContainerReadiness {
	Write-InfoLog "Running readiness checks..."
	Invoke-ContainerCommand "bash .devcontainer/scripts/checks/readiness.sh"

	$result = $LASTEXITCODE
	if ($result -eq 0) {
		Write-SuccessLog "Environment is ready!"
	}
	else {
		Write-WarningLog "Readiness check failed. Run setup first with './tdocker.ps1 setup'"
		return $result
	}
}

function Start-ForcePrecompile {
	Write-InfoLog "Forcing precompilation..."
	Invoke-ContainerCommand "FORCE_PRECOMPILE=1 bash .devcontainer/scripts/precompile/trigger.sh"

	if ($LASTEXITCODE -eq 0) {
		Invoke-ContainerCommand "touch $PRECOMPILE_MARKER"
		Write-SuccessLog "Precompilation completed successfully!"
	}
	else {
		Write-ErrorLog "Precompilation failed"
	}
}

function Get-ContainerLogs {
	Write-InfoLog "Container logs:"
	docker logs $CONTAINER_NAME
}

function Test-GpuStatus {
	Write-InfoLog "Checking GPU status in container..."
	Invoke-ContainerCommand "bash .devcontainer/scripts/checks/gpu-check.sh"

	# Display result from GPU check
	Invoke-ContainerCommand "cat .devcontainer/logs/gpu-check.log 2>/dev/null || echo 'No GPU check log found'"
}

function Test-AzureIntegration {
	Write-InfoLog "Checking Azure integration..."
	Invoke-ContainerCommand "bash .devcontainer/scripts/checks/azure-check.sh"

	if ($LASTEXITCODE -eq 0) {
		Write-SuccessLog "Azure integration is properly configured"
	}
	else {
		Write-WarningLog "Azure integration check failed. You may need to log in or configure Azure services."
	}
}

function Start-ResourceOptimization {
	Write-InfoLog "Optimizing container resources..."
	Invoke-ContainerCommand "bash .devcontainer/scripts/maintenance/optimize_resources.sh"

	if ($LASTEXITCODE -eq 0) {
		Write-SuccessLog "Resource optimization completed successfully!"
	}
	else {
		Write-WarningLog "Resource optimization completed with warnings"
	}
}

function Start-WorkspaceCleanup {
	Write-InfoLog "Cleaning workspace..."
	Invoke-ContainerCommand "bash .devcontainer/scripts/maintenance/clean_workspace.sh"

	if ($LASTEXITCODE -eq 0) {
		Write-SuccessLog "Workspace cleaned successfully!"
	}
	else {
		Write-WarningLog "Workspace cleaning completed with warnings"
	}
}

function Update-ContainerDependencies {
	Write-InfoLog "Updating dependencies and cached models..."
	Invoke-ContainerCommand "bash .devcontainer/scripts/maintenance/update.sh"

	if ($LASTEXITCODE -eq 0) {
		Write-SuccessLog "Dependencies and models updated successfully!"
	}
	else {
		Write-WarningLog "Update completed with warnings"
	}
}

function Start-ContainerTests {
	param([string]$TestType = "all")

	switch ($TestType) {
		"all" {
			Write-InfoLog "Running all tests..."
			Invoke-ContainerCommand "npm test"
		}
		"gpu" {
			Write-InfoLog "Running GPU tests..."
			Invoke-ContainerCommand "npm run test:gpu"
		}
		"no-gpu" {
			Write-InfoLog "Running non-GPU tests..."
			Invoke-ContainerCommand "npm run test:no-gpu"
		}
		"coverage" {
			Write-InfoLog "Running tests with coverage..."
			Invoke-ContainerCommand "npm run test:coverage"
		}
		default {
			Write-ErrorLog "Unknown test type: $TestType. Available options: all, gpu, no-gpu, coverage"
		}
	}

	if ($LASTEXITCODE -eq 0) {
		Write-SuccessLog "Tests completed successfully!"
	}
	else {
		Write-WarningLog "Tests completed with failures"
	}
}

# Main script execution
Confirm-DockerInstallation

# Handle command line arguments
if (-not $Command) {
	Show-HelpInfo
	exit 0
}

switch ($Command) {
	"status" {
		Get-ContainerStatus
	}
	"start" {
		Start-Containers
	}
	"stop" {
		Stop-Containers
	}
	"restart" {
		Restart-Containers
	}
	"setup" {
		Start-ContainerSetup
	}
	"check" {
		Test-ContainerReadiness
	}
	"precompile" {
		Start-ForcePrecompile
	}
	"exec" {
		if (-not $Arguments) {
			Write-ErrorLog "Missing command to execute"
		}
		$cmd = $Arguments -join " "
		Invoke-ContainerCommand $cmd
	}
	"logs" {
		Get-ContainerLogs
	}
	"gpu-check" {
		Test-GpuStatus
	}
	"azure-check" {
		Test-AzureIntegration
	}
	"optimize" {
		Start-ResourceOptimization
	}
	"clean" {
		Start-WorkspaceCleanup
	}
	"update" {
		Update-ContainerDependencies
	}
	"test" {
		if ($Arguments.Count -eq 0) {
			Start-ContainerTests "all"
		}
		else {
			Start-ContainerTests $Arguments[0]
		}
	}
	default {
		Write-ErrorLog "Unknown command: $Command"
		Show-HelpInfo
	}
}

exit 0