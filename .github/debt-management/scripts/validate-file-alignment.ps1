# PS_ID::VALIDATE_FILE_ALIGNMENT
<#
.SYNOPSIS
    Validates file alignments across extension and debt management.
.DESCRIPTION
    Ensures all files are properly aligned according to schema definitions
    and structural requirements, reporting any discrepancies.
#>

# PS_CONFIG::ERROR_HANDLING
$ErrorActionPreference = "Stop"

# PS_DEFINE::PATHS
# Define paths
$rootDir = Join-Path $PSScriptRoot "..\..\\"
$githubDir = Join-Path $rootDir ".github"
# $copilotDir = Join-Path $rootDir ".copilot"
$configDir = Join-Path $githubDir "config"
$metricsDir = Join-Path $githubDir "metrics"

# PS_DEFINE::CONFIG_FILES
# Load configurations
$extensionStructureFile = Join-Path $configDir "extension-structure.json"
$copilotConfigFile = Join-Path $configDir "copilot-integration.json"
$convergenceFile = Join-Path $metricsDir "convergence-tracking.json"

# PS_ACTION::CHECK_FILES_EXIST
# Check if files exist
$allFilesExist = $true

foreach ($file in @($extensionStructureFile, $copilotConfigFile, $convergenceFile)) {
	if (-not (Test-Path $file)) {
		Write-Host "Missing required file: $file" -ForegroundColor Red
		$allFilesExist = $false
	}
}

if (-not $allFilesExist) {
	Write-Host "Cannot validate alignments - missing required configuration files" -ForegroundColor Red
	exit 1
}

# PS_ACTION::LOAD_CONFIGS
# Load extension structure
$extensionStructure = Get-Content -Path $extensionStructureFile -Raw | ConvertFrom-Json
$convergenceTracking = Get-Content -Path $convergenceFile -Raw | ConvertFrom-Json

# PS_ACTION::PREPARE_VALIDATION
# Validate extension structure
$requiredDirs = $extensionStructure.structure.directories | Where-Object { $_.required -ne $false } | ForEach-Object { $_.path }
$requiredFiles = $extensionStructure.structure.files | Where-Object { $_.required -ne $false } | ForEach-Object { $_.path }

# PS_DEFINE::COUNTERS
# Initialize counters
$existingDirs = 0
$existingFiles = 0

# PS_ACTION::CHECK_DIRECTORIES
# Check directories
Write-Host "Checking required directories..." -ForegroundColor Cyan
foreach ($dir in $requiredDirs) {
	$fullPath = Join-Path $copilotDir $dir
	if (Test-Path $fullPath) {
		Write-Host "✅ $dir" -ForegroundColor Green
		$existingDirs++
	}
 else {
		Write-Host "❌ $dir" -ForegroundColor Red
	}
}

# Check files
Write-Host "`nChecking required files..." -ForegroundColor Cyan
foreach ($file in $requiredFiles) {
	$fullPath = Join-Path $copilotDir $file
	if (Test-Path $fullPath) {
		Write-Host "✅ $file" -ForegroundColor Green
		$existingFiles++
	}
 else {
		Write-Host "❌ $file" -ForegroundColor Red
	}
}

# Calculate completion percentage
$totalDirs = $requiredDirs.Count
$totalFiles = $requiredFiles.Count
$totalRequired = $totalDirs + $totalFiles
$totalExisting = $existingDirs + $existingFiles

$completionPercentage = [math]::Round(($totalExisting / $totalRequired) * 100, 2)

Write-Host "`nStructure Completion: $completionPercentage%" -ForegroundColor Cyan
Write-Host "Directories: $existingDirs/$totalDirs" -ForegroundColor Cyan
Write-Host "Files: $existingFiles/$totalFiles" -ForegroundColor Cyan

# Update convergence metrics
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Update structure-completion metric
$convergenceTracking.metrics.'structure-completion'.current = $completionPercentage
$convergenceTracking.metrics.'structure-completion'.history += @{
	"timestamp" = $timestamp
	"value"     = $completionPercentage
}

# Update convergence step status
if ($completionPercentage -eq 100) {
	$convergenceTracking.convergenceSteps.'structure-alignment'.status = "complete"
	$convergenceTracking.convergenceSteps.'structure-alignment'.progress = 100
	if (-not $convergenceTracking.convergenceSteps.'structure-alignment'.completionDate) {
		$convergenceTracking.convergenceSteps.'structure-alignment'.completionDate = $timestamp
	}
}
else {
	$convergenceTracking.convergenceSteps.'structure-alignment'.status = "in-progress"
	$convergenceTracking.convergenceSteps.'structure-alignment'.progress = $completionPercentage
	if (-not $convergenceTracking.convergenceSteps.'structure-alignment'.startDate) {
		$convergenceTracking.convergenceSteps.'structure-alignment'.startDate = $timestamp
	}
}

# Add iteration record
$iteration = @{
	"timestamp" = $timestamp
	"type"      = "structure-validation"
	"metrics"   = @{
		"structureCompletion" = $completionPercentage
	}
}
$convergenceTracking.iterations += $iteration

# Update last updated timestamp
$convergenceTracking.lastUpdated = $timestamp

# Save updated tracking
$convergenceTracking | ConvertTo-Json -Depth 10 | Set-Content -Path $convergenceFile -Encoding UTF8

Write-Host "`nConvergence metrics updated" -ForegroundColor Green
Write-Host "Report saved to: $convergenceFile" -ForegroundColor Green
