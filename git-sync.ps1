# --- Automation Flag ---
$autoConfirm = $true

$ErrorActionPreference = "Stop"

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

$EXPECTED_ORIGIN = "https://github.com/DeanLuus22021994/transformers.js-examples.git"
$EXPECTED_BRANCH = "DeanDev"
$GIT_USERNAME = "DeanLuus22021994"
$GIT_EMAIL = "DeanLuus22021994@gmail.com"

Write-ColorText -Text "Initializing Git operations..." -Color $Blue
if (-not (Test-Path ".git")) {
	Write-ColorText -Text "Not a Git repository. Please run this script from the root of your Git repository." -Color $Red
	exit 1
}

try { git symbolic-ref HEAD > $null } catch { Write-ColorText -Text "Detached HEAD or non-standard state detected. Aborting." -Color $Red; exit 1 }

git config user.name $GIT_USERNAME
git config user.email $GIT_EMAIL
git config --global credential."$($EXPECTED_ORIGIN)".username $GIT_USERNAME
Write-ColorText -Text "Git configured for user: $GIT_USERNAME <$GIT_EMAIL>" -Color $Green

$currentBranch = git branch --show-current
if ($currentBranch -ne $EXPECTED_BRANCH) {
	git checkout $EXPECTED_BRANCH 2>$null || git checkout -b $EXPECTED_BRANCH
	$currentBranch = $EXPECTED_BRANCH
}

$remoteUrl = $null
$remoteExists = $false
$remotes = git remote
if ($remotes -contains "origin") {
	$remoteExists = $true
	$remoteUrl = git remote get-url origin
	if ($remoteUrl -ne $EXPECTED_ORIGIN) {
		git remote set-url origin $EXPECTED_ORIGIN
		$remoteUrl = $EXPECTED_ORIGIN
	}
}
else {
	git remote add origin $EXPECTED_ORIGIN
	$remoteUrl = $EXPECTED_ORIGIN
	$remoteExists = $true
}

$patAvailable = [bool]$env:PERSONAL_ACCESS_TOKEN

try {
	git gc --quiet
	git repack -d > $null
}
catch {}

$status = git status --porcelain
$addedFiles = ($status | Where-Object { $_ -match '^\?\?' }).Count
$modifiedFiles = ($status | Where-Object { $_ -match '^.M' }).Count
$deletedFiles = ($status | Where-Object { $_ -match '^.D' }).Count
$totalChanges = $addedFiles + $modifiedFiles + $deletedFiles

$copilotAwarenessPath = "."
$copilotFileCount = Get-ChildItem -Path $copilotAwarenessPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count
$copilotMetadataRefresh = $true

Write-ColorText -Text "`nGit Status Summary:" -Color $Magenta
Write-Host "- Branch: $currentBranch"
Write-Host "- Remote: $remoteUrl"
Write-ColorText -Text "File metrics:" -Color $Blue
Write-Host "- New: $addedFiles"
Write-Host "- Modified: $modifiedFiles"
Write-Host "- Deleted: $deletedFiles"
Write-Host "- Total: $totalChanges"
Write-Host "- Files detected (Copilot context): $copilotFileCount"
Write-Host "- PAT available: $patAvailable"

Write-ColorText -Text "`nRecent 10 Git Commits:" -Color $Blue
git log -n 10 --pretty=format:"[%h] :: %s :: %cn :: %cd" --date=iso-strict | ForEach-Object { Write-Host $_ }

$unpushedCommits = git cherry -v
$hasUnpushedCommits = [bool]($unpushedCommits)

if ($totalChanges -eq 0 -and -not $hasUnpushedCommits) {
	if ($copilotMetadataRefresh) {
		$null = Get-ChildItem -Path $copilotAwarenessPath -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $null = $_.Length }
	}
	Write-ColorText -Text "`nNo changes or commits to push. Exiting cleanly." -Color $Green
	exit 0
}

if ($totalChanges -gt 0) {
	git add --all
	$dateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
	$commitMessage = "Git Sync - $dateTime | Changes: $totalChanges files ($addedFiles added, $modifiedFiles modified, $deletedFiles deleted)"
	git commit -m $commitMessage
}

if ($remoteExists) {
	Write-ColorText -Text "Pushing to remote origin..." -Color $Blue
	if ($patAvailable) {
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

	if ($exitCode -ne 0) {
		Write-ColorText -Text "Push failed." -Color $Red
		exit 1
	}
}
else {
	Write-ColorText -Text "Remote not configured. Local commit complete." -Color $Yellow
}

if ($copilotMetadataRefresh) {
	$null = Get-ChildItem -Path $copilotAwarenessPath -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $null = $_.LastWriteTimeUtc }
}

Write-ColorText -Text "`nGit automation completed." -Color $Green
Write-Host "- Branch: $currentBranch"
Write-Host "- Remote: $remoteUrl"
