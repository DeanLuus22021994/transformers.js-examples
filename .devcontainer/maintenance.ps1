<#
.SYNOPSIS
    Container maintenance script for transformers.js-examples development environment
.DESCRIPTION
    This script handles container maintenance operations including:
    - Creating required volume directories
    - Ensuring proper BuildKit configuration
    - Managing container lifecycle
    - Optimizing for GPU passthrough and NVMe usage
#>

# Ensure we stop on errors
$ErrorActionPreference = "Stop"

# ANSI color codes for PowerShell
$Green = [char]27 + "[32m"
$Yellow = [char]27 + "[33m"
$Red = [char]27 + "[31m"
$Reset = [char]27 + "[0m"

function Write-ColorMessage {
	param(
		[string]$Message,
		[string]$Color
	)
	Write-Host "$Color$Message$Reset"
}

function Write-Success {
	param([string]$Message)
	Write-ColorMessage -Message "[SUCCESS] $Message" -Color $Green
}

function Write-Warning {
	param([string]$Message)
	Write-ColorMessage -Message "[WARNING] $Message" -Color $Yellow
}

function Write-Error {
	param([string]$Message)
	Write-ColorMessage -Message "[ERROR] $Message" -Color $Red
	exit 1
}

function Test-Command {
	param([string]$Command)
	$null = Get-Command $Command -ErrorAction SilentlyContinue
	return $?
}

# Check if Docker is installed
if (-not (Test-Command -Command "docker")) {
	Write-Error "Docker is not installed or not in PATH."
}

# Check for BuildKit support
$env:DOCKER_BUILDKIT = 1
$env:COMPOSE_DOCKER_CLI_BUILD = 1

# Create volume directories if they don't exist
$volumeDirs = @(
	"volumes/node_modules",
	"volumes/precompiled",
	"volumes/cache",
	"volumes/config"
)

foreach ($dir in $volumeDirs) {
	if (-not (Test-Path "./$dir")) {
		Write-Host "Creating directory: $dir"
		New-Item -Path "./$dir" -ItemType Directory -Force | Out-Null
	}
}

# Create config directory for volume binding
if (-not (Test-Path "./volumes/config")) {
	New-Item -Path "./volumes/config" -ItemType Directory -Force | Out-Null
}

# Check for GPU drivers
$gpuPresent = $false
if (Get-Command "nvidia-smi" -ErrorAction SilentlyContinue) {
	try {
		$gpuInfo = & nvidia-smi --query-gpu=name --format=csv, noheader
		if ($gpuInfo) {
			Write-Success "NVIDIA GPU detected: $gpuInfo"
			$gpuPresent = $true
		}
	}
	catch {
		Write-Warning "NVIDIA drivers are installed but couldn't query GPU."
	}
}
else {
	Write-Warning "No NVIDIA GPU detected. Precompilation will use CPU mode."
}

# Create device map configuration based on GPU availability
$deviceMapContent = if ($gpuPresent) {
	@"
{
  "model": "auto",
  "strategy": "auto"
}
"@
}
else {
	@"
{
  "model": "cpu",
  "strategy": "sequential"
}
"@
}
$deviceMapContent | Out-File -FilePath "./volumes/config/device_map.json" -Encoding utf8 -Force

# Check if containers are running
$containersRunning = docker ps -q --filter "name=transformers"
if (-not $containersRunning) {
	Write-Host "Starting up containers using docker-compose..."
	docker-compose up -d --build
}
else {
	Write-Host "Containers are already running."
}

# Ensure files have correct line endings if running on Windows
if ($IsWindows -or $env:OS -match "Windows") {
	Write-Host "Ensuring scripts have proper line endings..."
	if (Test-Command -Command "dos2unix") {
		Get-ChildItem -Path "./scripts/" -Recurse -Filter "*.sh" | ForEach-Object {
			dos2unix $_.FullName
		}
	}
	else {
		Write-Warning "dos2unix not found. Script files may have incorrect line endings."
	}
}

# Create precompilation trigger marker if not exists
if (-not (Test-Path "./.devcontainer/.precompile-init")) {
	"$(Get-Date)" | Out-File -FilePath "./.devcontainer/.precompile-init" -Encoding utf8
	Write-Host "Created precompilation trigger marker."
}

Write-Success "Container maintenance completed successfully."
Write-Host ""
Write-Host "To start development environment: docker-compose up -d"
Write-Host "To rebuild with newer images:     docker-compose build --pull"
Write-Host "To force precompilation:          docker exec transformers-js-examples_dev_1 bash -c 'FORCE_PRECOMPILE=1 bash .devcontainer/scripts/precompile/trigger.sh'"
Write-Host ""