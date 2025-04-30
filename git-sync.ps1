$ErrorActionPreference = "Stop"

$EXPECTED_ORIGIN = "https://github.com/DeanLuus22021994/transformers.js-examples.git"
$EXPECTED_BRANCH = "DeanDev"
$GIT_USERNAME = "DeanLuus22021994"
$GIT_EMAIL = "DeanLuus22021994@gmail.com"

function Write-Info([string]$message) {
	Write-Information -MessageData $message -InformationAction Continue
}

function Test-DetachedHead {
	$head = git symbolic-ref -q HEAD 2>$null
	return -not $head
}

Write-Info "::INIT:: Starting Git automation task"
if (-not (Test-Path ".git")) {
	Write-Info "::ERROR:: Not a Git repository"
	exit 1
}

if (Test-DetachedHead) {
	Write-Info "::ABORTED:: Detached HEAD state detected. Git operations skipped."
	exit 0
}

try {
	git config user.name $GIT_USERNAME
	git config user.email $GIT_EMAIL
	git config --global credential."$($EXPECTED_ORIGIN)".username $GIT_USERNAME
}
catch { Write-Info "::ERROR:: Git config failed"; exit 1 }

$currentBranch = git branch --show-current
if ($currentBranch -ne $EXPECTED_BRANCH) {
	try {
		git checkout $EXPECTED_BRANCH 2>$null
	}
 catch {
		git checkout -b $EXPECTED_BRANCH
	}
	$currentBranch = $EXPECTED_BRANCH
}

try {
	$remoteUrl = git remote get-url origin 2>$null
}
catch {
	$remoteUrl = $null
}

if (-not $remoteUrl) {
	try {
		git remote add origin $EXPECTED_ORIGIN
		$remoteUrl = $EXPECTED_ORIGIN
	}
	catch {
		Write-Info "::ERROR:: Remote origin not set. Configure with 'git remote add origin <url>'"
		exit 1
	}
}

if ($remoteUrl -ne $EXPECTED_ORIGIN) {
	Write-Info "::WARNING:: Remote origin URL does not match expected value"
}

try {
	git gc --quiet
	git repack -d > $null
}
catch {
	# Gracefully continue if optimization fails
}

$status = git status --porcelain
$addedFiles = ($status | Where-Object { $_ -match '^\?\?' }).Count
$modifiedFiles = ($status | Where-Object { $_ -match '^.M' }).Count
$deletedFiles = ($status | Where-Object { $_ -match '^.D' }).Count
$totalChanges = $addedFiles + $modifiedFiles + $deletedFiles

# Extract diff stats before commit
$insertions = 0
$deletions = 0
$shortStat = git diff --shortstat
if ($shortStat) {
	if ($shortStat -match '(\d+) insertions?') { $insertions = [int]$matches[1] }
	if ($shortStat -match '(\d+) deletions?') { $deletions = [int]$matches[1] }
}

# Count staged and untracked files
$stagedFiles = (git diff --cached --name-only | Measure-Object).Count
$untrackedFiles = (git ls-files --others --exclude-standard | Measure-Object).Count

# Create commit delta information
$commitDelta = @{
	Insertions     = $insertions
	Deletions      = $deletions
	StagedFiles    = $stagedFiles
	UntrackedFiles = $untrackedFiles
	TotalChanges   = $totalChanges
}

Write-Info "::STATUS:: Branch=$currentBranch Remote=$remoteUrl"
Write-Info "::SUMMARY:: Added=$addedFiles Modified=$modifiedFiles Deleted=$deletedFiles Total=$totalChanges"
Write-Info "::DELTA:: Insertions=$insertions Deletions=$deletions Staged=$stagedFiles Untracked=$untrackedFiles"

# Output commit delta in structured format for Copilot context
$commitDeltaJson = $commitDelta | ConvertTo-Json -Compress
Write-Info "::COMMITDELTA:: $commitDeltaJson"

Write-Info "::COMMITS:: Last 10"
git log -n 10 --pretty=format:"[%h] :: %s :: %cn :: %cd" --date=iso-strict | ForEach-Object { Write-Information $_ -InformationAction Continue }

$unpushedCommits = git cherry -v
$hasUnpushedCommits = [bool]($unpushedCommits)

if ($totalChanges -eq 0 -and -not $hasUnpushedCommits) {
	Write-Info "::SKIPPEDPUSH:: No changes to push. Working tree and index are clean."
	exit 0
}

$commitOccurred = $false
if ($totalChanges -gt 0) {
	try {
		git add --all
		$now = Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"
		$contextSummary = "[CopilotIndex]`nFiles: $totalChanges ($addedFiles added, $modifiedFiles modified, $deletedFiles deleted)`nSummary: Auto-sync`nContext: transformers.js-examples - $currentBranch`nTimestamp: $now`nDelta: +$insertions/-$deletions"
		$commitMessage = "Git Sync - $now`n$contextSummary"
		git commit -m $commitMessage
		$commitOccurred = $true
	}
	catch {
		Write-Info "::ERROR:: Commit failed: $_"
		exit 1
	}
}

if ($remoteUrl) {
	try {
		if ($env:PERSONAL_ACCESS_TOKEN) {
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
			Write-Info "::PUSH:: Changes pushed to $remoteUrl"
		}
		else {
			Write-Info "::ERROR:: Push failed"
			exit 1
		}
 }
	catch {
		Write-Info "::ERROR:: Exception during push: $_"
		exit 1
	}
}
else {
	Write-Info "::NOPUSH:: Remote origin not configured"
	exit 1
}

if ($commitOccurred) {
	try {
		$lastCommit = git rev-parse HEAD
		$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"
		"$timestamp | Branch=$currentBranch | Commit=$lastCommit | Files=$totalChanges" | Out-File -FilePath "./copilot-sync.log" -Append -Encoding utf8
		Write-Info "::COPILOT:: Sync log updated"
	}
 catch {
		Write-Info "::ERROR:: Failed to write Copilot sync log"
	}
}

Write-Info "::COMPLETE:: Git automation finished"
