# --- Automation Flag ---
$autoConfirm = $true # Set to $false to require manual confirmation

<#
.SYNOPSIS
    Commits and synchronizes changes to DeanLuus22021994/transformers.js-examples repository
.DESCRIPTION
    This script optimizes, stages, commits, and pushes changes to the specific GitHub repository.
    It uses the PAT from environment variables and performs git optimization before committing.
#>

$ErrorActionPreference = "Stop"

# Colors for console output
$Green = [char]27 + "[32m"
$Yellow = [char]27 + "[33m"
$Red = [char]27 + "[31m"
$Blue = [char]27 + "[36m"
$Magenta = [char]27 + "[35m"
$Reset = [char]27 + "[0m"

function Write-ColorText {
	param(
		[Parameter(Mandatory = $true)]
		[string]$Text,
		[Parameter(Mandatory = $true)]
		[string]$Color
	)
	Write-Host "$Color$Text$Reset"
}

# Constants
$EXPECTED_ORIGIN = "https://github.com/DeanLuus22021994/transformers.js-examples.git"
$EXPECTED_BRANCH = "DeanDev"
$GIT_USERNAME = "DeanLuus22021994"
$GIT_EMAIL = "DeanLuus22021994@gmail.com"

# Check if we're in a git repository
Write-ColorText -Text "Initializing Git operations..." -Color $Blue
if (-not (Test-Path ".git")) {
	Write-ColorText -Text "Not a Git repository. Please run this script from the root of your Git repository." -Color $Red
	exit 1
}

# Set Git configuration without prompting
git config user.name $GIT_USERNAME
git config user.email $GIT_EMAIL
Write-ColorText -Text "Git configured for user: $GIT_USERNAME <$GIT_EMAIL>" -Color $Green

# Check current branch
$currentBranch = git branch --show-current
if ($currentBranch -ne $EXPECTED_BRANCH) {
	git checkout $EXPECTED_BRANCH 2>$null || git checkout -b $EXPECTED_BRANCH
	$currentBranch = $EXPECTED_BRANCH
}

# Verify or configure remote
$remoteUrl = $null
$remoteExists = $false
$remotes = git remote
if ($remotes -contains "origin") {
	$remoteExists = $true
	$remoteUrl = git remote get-url origin
	if ($remoteUrl -ne $EXPECTED_ORIGIN) {
		Write-ColorText -Text "WARNING: Remote URL is different than expected!" -Color $Red
		Write-ColorText -Text "Current:  $remoteUrl" -Color $Yellow
		Write-ColorText -Text "Expected: $EXPECTED_ORIGIN" -Color $Yellow
		git remote set-url origin $EXPECTED_ORIGIN
		Write-ColorText -Text "Remote URL forcibly updated to $EXPECTED_ORIGIN." -Color $Green
	}
}
else {
	Write-ColorText -Text "Remote origin not found. Adding..." -Color $Yellow
	git remote add origin $EXPECTED_ORIGIN
	$remoteUrl = $EXPECTED_ORIGIN
	$remoteExists = $true
	Write-ColorText -Text "Remote origin added." -Color $Green
}

# Verify PAT is available
$patAvailable = [bool]$env:PERSONAL_ACCESS_TOKEN
if (-not $patAvailable) {
	Write-ColorText -Text "WARNING: Personal Access Token not found in environment variables." -Color $Red
	Write-ColorText -Text "Push operations may fail or prompt for credentials." -Color $Yellow
}

# Optimize local git repository
Write-ColorText -Text "Optimizing local git repository..." -Color $Blue
try {
	git gc
	git repack -d
}
catch {
	Write-ColorText -Text "Repository optimization failed, but continuing with sync." -Color $Yellow
}

# Status before indexing
Write-ColorText -Text "Getting file metrics before staging..." -Color $Blue
$status = git status --porcelain
$addedFiles = ($status | Where-Object { $_ -match '^\?\?' }).Count
$modifiedFiles = ($status | Where-Object { $_ -match '^.M' }).Count
$deletedFiles = ($status | Where-Object { $_ -match '^.D' }).Count
$totalChanges = $addedFiles + $modifiedFiles + $deletedFiles

# Display summary before confirmation
Write-ColorText -Text "`nGit Status Summary:" -Color $Magenta
Write-Host "- Current local branch: $currentBranch"
Write-Host "- Current origin configured: $remoteUrl"
Write-ColorText -Text "File metrics:" -Color $Blue
Write-Host "- New files: $addedFiles"
Write-Host "- Modified files: $modifiedFiles"
Write-Host "- Deleted files: $deletedFiles"
Write-Host "- Total changes: $totalChanges"
Write-Host "- PAT available: $patAvailable"

# Confirmation prompt
if (-not $autoConfirm) {
	Write-ColorText -Text "`nReady to commit and push changes." -Color $Yellow
	Write-Host "Press Enter to continue, Ctrl+C to cancel..." -NoNewline
	$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
	Write-Host "`n"
}
else {
	Write-ColorText -Text "Auto-confirm enabled: proceeding without manual intervention." -Color $Green
}

# Stage all changes
Write-ColorText -Text "Staging all changes..." -Color $Blue
git add --all

# Generate commit message with date/time and metrics
$dateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Git Sync - $dateTime | Changes: $totalChanges files ($addedFiles added, $modifiedFiles modified, $deletedFiles deleted)"
Write-ColorText -Text "Using commit message: $commitMessage" -Color $Blue

# Commit changes
Write-ColorText -Text "Committing changes..." -Color $Blue
git commit -m $commitMessage

# Push changes to remote
if ($remoteExists) {
	Write-ColorText -Text "Pushing changes to remote origin..." -Color $Blue

	if ($patAvailable) {
		# Use a temporary credential helper to avoid exposing PAT in process list
		Write-ColorText -Text "Pushing to $EXPECTED_ORIGIN using PAT (credentials not exposed in process list)..." -Color $Blue
		$env:GIT_ASKPASS = $null
		$env:GIT_TERMINAL_PROMPT = "0"
		$gitCredHelper = "!f() { echo username=$GIT_USERNAME; echo password=$env:PERSONAL_ACCESS_TOKEN; }; f"
		git -c credential.helper="$gitCredHelper" push origin $currentBranch
		$exitCode = $LASTEXITCODE
		Remove-Item Env:GIT_ASKPASS -ErrorAction SilentlyContinue
		Remove-Item Env:GIT_TERMINAL_PROMPT -ErrorAction SilentlyContinue
	}
	else {
		git push origin $currentBranch
		$exitCode = $LASTEXITCODE
	}

	if ($exitCode -eq 0) {
		Write-ColorText -Text "Changes pushed successfully to $EXPECTED_ORIGIN." -Color $Green
	}
	else {
		Write-ColorText -Text "Failed to push changes." -Color $Red
		exit 1
	}
}
else {
	Write-ColorText -Text "No remote configured. Changes committed locally only." -Color $Yellow
}

# Final status
Write-ColorText -Text "`nGit sync completed!" -Color $Green
Write-Host "- Branch: $currentBranch"
Write-Host "- Commit: $commitMessage"
Write-Host "- Remote: $remoteUrl"