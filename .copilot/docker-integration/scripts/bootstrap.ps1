# PowerShell script to bootstrap the Docker integration for transformers.js
# This script runs when a terminal is opened in VS Code

# ANSI colors for output
$ESC = [char]27
$RESET = "$ESC[0m"
$GREEN = "$ESC[32m"
$YELLOW = "$ESC[33m"
$BLUE = "$ESC[34m"
$CYAN = "$ESC[36m"

function Write-ColorOutput {
	param(
		[string]$Message,
		[string]$Color
	)
	Write-Host "$Color$Message$RESET"
}

# Show welcome message
Write-ColorOutput "🐳 Transformers.js Docker Integration" $CYAN
Write-ColorOutput "Initializing Docker environment..." $BLUE

# Check if Docker is available
try {
	$dockerVersion = docker version --format '{{.Server.Version}}' 2>$null
	if ($LASTEXITCODE -ne 0) {
		Write-ColorOutput "Docker is not running. Please start Docker Desktop." $YELLOW
		exit 1
	}
 else {
		Write-ColorOutput "✅ Docker is running (version $dockerVersion)" $GREEN
	}
}
catch {
	Write-ColorOutput "Docker is not installed or not in PATH. Please install Docker Desktop." $YELLOW
	exit 1
}

# Define paths
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$integrationDir = Join-Path $rootDir ".copilot" "docker-integration"
$cliPath = Join-Path $integrationDir "dist" "cli.js"

# Check if integration is built
if (-Not (Test-Path $cliPath)) {
	Write-ColorOutput "Building Docker integration..." $BLUE
	Push-Location $integrationDir
	npm install
	npm run build
	Pop-Location
}

# Start the integration in the background
Write-ColorOutput "Starting Docker integration services..." $BLUE

# Run the integration CLI
try {
	node $cliPath start --silent
	if ($LASTEXITCODE -eq 0) {
		Write-ColorOutput "✅ Docker integration initialized successfully" $GREEN
		Write-ColorOutput "Available commands:" $CYAN
		Write-ColorOutput "  - tdocker status    : Show status of Docker services" $CYAN
		Write-ColorOutput "  - tdocker start     : Start Docker services" $CYAN
		Write-ColorOutput "  - tdocker stop      : Stop Docker services" $CYAN
		Write-ColorOutput "  - tdocker restart   : Restart Docker services" $CYAN
		Write-ColorOutput "  - tdocker logs      : Show logs from Docker services" $CYAN
		Write-ColorOutput "  - tdocker cache     : Manage the model cache" $CYAN
		Write-ColorOutput "  - tdocker help      : Show help" $CYAN
	}
 else {
		Write-ColorOutput "Failed to initialize Docker integration. Check logs for details." $YELLOW
	}
}
catch {
	Write-ColorOutput "Error initializing Docker integration: $_" $YELLOW
}

# Add the CLI to the path for this session
$env:Path = "$integrationDir\bin;$env:Path"

# Create an alias for the CLI
Set-Alias -Name tdocker -Value "$cliPath" -Scope Global

# Check if there are example projects that need Docker
$exampleCount = (Get-ChildItem -Path $rootDir -Directory | Where-Object { Test-Path (Join-Path $_ "docker-compose.yml") }).Count
if ($exampleCount -gt 0) {
	Write-ColorOutput "Found $exampleCount example(s) with Docker Compose configuration" $BLUE
}
