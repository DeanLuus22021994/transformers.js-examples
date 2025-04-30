# Define ANSI escape sequences
$ansiReset = "`e[0m"
$bold = "`e[1m"
$underline = "`e[4m"

$red = "`e[31m"
$green = "`e[32m"
$yellow = "`e[33m"

# Compose heading styles
$headingRed = "$bold$underline$red"
$headingGreen = "$bold$underline$green"

# STEP 1: Dynamically find all unique parent 'node_modules' directories
$basePath = (Get-Location).Path

$excludedPaths = Get-ChildItem -Directory -Recurse |
Where-Object { $_.FullName -match '[\\\/]node_modules([\\\/]|$)' } |
ForEach-Object {
	$nodeModulesRoot = $_.FullName -replace '\\node_modules.*$', '\node_modules'
	$relative = $nodeModulesRoot.Replace($basePath + '\', '')
	$relative
} | Sort-Object -Unique

# STEP 2: Output excluded paths with formatting
Write-Host "`n$headingRed`nExcluded Directories:$ansiReset`n"
$excludedPaths | ForEach-Object {
	Write-Host "$red$_$ansiReset"
}

# Blank line
Write-Host ""

# STEP 3: Normalize exclusion paths
$excludedFullPaths = $excludedPaths | ForEach-Object {
	[IO.Path]::GetFullPath((Join-Path $basePath $_)).ToLowerInvariant()
}

# STEP 4: Allowed subdirs (e.g., .bin)
$allowedSubPaths = @(
	'.copilot\node_modules\.bin'
) | ForEach-Object {
	[IO.Path]::GetFullPath((Join-Path $basePath $_)).ToLowerInvariant()
}

# STEP 5: Output header for included analysis
Write-Host "$headingGreen`nIncluded Files:$ansiReset`n"

# STEP 6: Process files
Get-ChildItem -Recurse -File | Where-Object {
	$filePath = $_.FullName.ToLowerInvariant()
	$exclude = $false

	foreach ($excluded in $excludedFullPaths) {
		if ($filePath.StartsWith($excluded)) {
			$allow = $false
			foreach ($allowed in $allowedSubPaths) {
				if ($filePath.StartsWith($allowed)) {
					$allow = $true
					break
				}
			}
			if (-not $allow) {
				$exclude = $true
				break
			}
		}
	}

	return -not $exclude
} | ForEach-Object {
	$relativePath = $_.FullName.Replace($basePath + '\', '')
	$content = Get-Content $_.FullName

	if ($content -match '^\s*#\s*Todo:') {
		Write-Host "$green$relativePath$ansiReset $yellow(Todo Detected)$ansiReset"
	}
	elseif ($content.Count -eq 0) {
		Write-Host "$green$relativePath$ansiReset $yellow(Empty File)$ansiReset"
	}
	else {
		$lines = $content.Count
		$blankLines = ($content -match '^\s*$').Count
		$codeLines = $lines - $blankLines
		$comments = ($content -match '^\s*#').Count
		$chars = ($content -join '').Length
		$branches = ($content -match '\b(if|elseif|while|for|foreach|switch|catch)\b').Count + 1
		$ccp = "{0:P2}" -f ($branches / [math]::Max($codeLines, 1))
		$uniqueLines = ($content | Where-Object { $_ -notmatch '^\s*$' } | Select-Object -Unique).Count
		$redundancy = "{0:P2}" -f (1 - ($uniqueLines / [math]::Max($codeLines, 1)))

		Write-Host "$green$relativePath$ansiReset $yellow(Lines: $lines, Blank: $blankLines, Comments: $comments, Chars: $chars, CCP: $ccp, Redundancy: $redundancy)$ansiReset"
	}
}
