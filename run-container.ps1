<#
.SYNOPSIS
    Runs the development container with proper GPU passthrough and volume mounting
.DESCRIPTION
    This script prepares the environment and starts the development container
    with all necessary volume mounts and GPU passthrough configuration
#>

$ErrorActionPreference = "Stop"

# Colors for console output
$Green = [char]27 + "[32m"
$Yellow = [char]27 + "[33m"
$Red = [char]27 + "[31m"
$Reset = [char]27 + "[0m"

function Write-ColorText {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Text,
        [Parameter(Mandatory=$true)]
        [string]$Color
    )
    Write-Host "$Color$Text$Reset"
}

# Verify Docker is installed
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-ColorText -Text "Docker is not installed or not in PATH." -Color $Red
    exit 1
}

# Enable BuildKit for better caching
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1

# Create required directories
$directories = @(
    ".devcontainer\volumes\node_modules",
    ".devcontainer\volumes\precompiled",
    ".devcontainer\volumes\cache",
    ".devcontainer\volumes\config"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        Write-ColorText -Text "Creating directory: $dir" -Color $Yellow
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
}

# Check for NVIDIA GPU
$gpuAvailable = $false
if (Get-Command "nvidia-smi" -ErrorAction SilentlyContinue) {
    try {
        $gpuInfo = & nvidia-smi --query-gpu=name --format=csv,noheader
        if ($gpuInfo) {
            Write-ColorText -Text "NVIDIA GPU detected: $gpuInfo" -Color $Green
            $gpuAvailable = $true
        }
    }
    catch {
        Write-ColorText -Text "NVIDIA drivers found but couldn't query GPU" -Color $Yellow
    }
}

if (-not $gpuAvailable) {
    Write-ColorText -Text "No NVIDIA GPU detected. Container will run with CPU only." -Color $Yellow
}

# Run maintenance script if it exists
if (Test-Path ".devcontainer\maintenance.ps1") {
    Write-ColorText -Text "Running container maintenance script..." -Color $Green
    & .\.devcontainer\maintenance.ps1
}
else {
    # Start the container
    Write-ColorText -Text "Starting development container..." -Color $Green

    # Set working directory to .devcontainer folder
    Push-Location .\.devcontainer

    try {
        # Build and start the containers
        docker-compose up -d --build

        if ($LASTEXITCODE -eq 0) {
            Write-ColorText -Text "Container started successfully." -Color $Green

            # Display container access information
            Write-Host ""
            Write-Host "To access the container:"
            Write-Host "  - VSCode: Use 'Remote-Containers: Reopen in Container'"
            Write-Host "  - Terminal: docker exec -it transformers-js-examples_dev_1 bash"
            Write-Host ""
            Write-Host "To view logs: docker-compose logs -f"
        }
        else {
            Write-ColorText -Text "Failed to start container." -Color $Red
        }
    }
    finally {
        # Restore original directory
        Pop-Location
    }
}

# Final guidance
Write-Host ""
Write-ColorText -Text "Container is now ready for development." -Color $Green
Write-Host "You can open VSCode and use the Remote-Containers extension to develop inside the container."
Write-Host ""