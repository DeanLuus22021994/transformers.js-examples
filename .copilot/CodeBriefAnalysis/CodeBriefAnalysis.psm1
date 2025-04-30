function Invoke-CodeBriefAnalysis {
	[CmdletBinding()]
	param (
		[string]$RootPath = (Get-Location).Path
	)

	# ANSI Sequences
	$ansiReset = "`e[0m"
	$bold = "`e[1m"
	$underline = "`e[4m"
	$red = "`e[31m"
	$green = "`e[32m"
	$yellow = "`e[33m"
	$headingRed = "$bold$underline$red"
	$headingGreen = "$bold$underline$green"

	# Step 1: Find top-level node_modules dirs
	$excludedPaths = Get-ChildItem -Path $RootPath -Directory -Recurse |
	Where-Object { $_.FullName -match '[\\\/]node_modules([\\\/]|$)' } |
	ForEach-Object {
		$nodeModulesRoot = $_.FullName -replace '\\node_modules.*$', '\node_modules'
		$relative = $nodeModulesRoot.Replace($RootPath + '\', '')
		$relative
	} | Sort-Object -Unique

	# Step 2: Display Excluded Dirs
	Write-Host "`n$headingRed`nExcluded Directories:$ansiReset`n"
	$excludedPaths | ForEach-Object {
		Write-Host "$red$_$ansiReset"
	}

	Write-Host ""

	# Step 3: Normalize exclusion paths
	$excludedFullPaths = $excludedPaths | ForEach-Object {
		[IO.Path]::GetFullPath((Join-Path $RootPath $_)).ToLowerInvariant()
	}

	# Step 4: Explicit subpath inclusions
	$allowedSubPaths = @(
		'.copilot\node_modules\.bin'
	) | ForEach-Object {
		[IO.Path]::GetFullPath((Join-Path $RootPath $_)).ToLowerInvariant()
	}

	# Step 5: Show included files heading
	Write-Host "$headingGreen`nIncluded Files:$ansiReset`n"

	# Step 6: Process files
	Get-ChildItem -Path $RootPath -Recurse -File | Where-Object {
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
		$relativePath = $_.FullName.Replace($RootPath + '\', '')
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
}
