<#
.SYNOPSIS
    Functions for analyzing and managing development debt
.DESCRIPTION
    This module provides functions to find, analyze and report on technical debt in a codebase
#>

# Get current script path
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Import required modules
Import-Module "$ScriptPath\CodeBriefAnalysis.psm1" -Force

function Find-DevDebt {
	<#
    .SYNOPSIS
        Finds potential technical debt in the codebase
    .DESCRIPTION
        Analyzes code patterns, TODOs, and other indicators of technical debt
    .PARAMETER Path
        Path to analyze for technical debt
    .EXAMPLE
        Find-DevDebt -Path C:\Projects\MyProject
    #>
	[CmdletBinding()]
	param (
		[Parameter(Mandatory = $false)]
		[string]$Path = (Get-Location).Path
	)

	Write-Host "Finding development debt in: $Path" -ForegroundColor Cyan

	# Find all Dev_Debt.md files
	$devDebtFiles = Get-ChildItem -Path $Path -Filter "Dev_Debt.md" -Recurse -File
	Write-Host "Found $($devDebtFiles.Count) Dev_Debt.md files" -ForegroundColor Yellow

	# Find TODO comments in code
	$todoPatterns = @('TODO:', 'FIXME:', 'HACK:', 'XXX:', 'BUG:')
	$todoResults = @()

	# Exclude node_modules, dist, build directories
	$excludeDirs = @('node_modules', 'dist', 'build', '.git')
	$excludePattern = [string]::Join('|', ($excludeDirs | ForEach-Object { [regex]::Escape($_) }))

	# Get all source code files
	$sourceExtensions = @('.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.css', '.scss', '.html')
	$sourceFiles = Get-ChildItem -Path $Path -Recurse -File |
	Where-Object {
		$_.Extension -in $sourceExtensions -and
		$_.FullName -notmatch $excludePattern
	}

	foreach ($file in $sourceFiles) {
		$content = Get-Content -Path $file.FullName -Raw
		$lineNum = 1

		foreach ($line in ($content -split "`r`n|`r|`n")) {
			foreach ($pattern in $todoPatterns) {
				if ($line -match $pattern) {
					$todoResults += [PSCustomObject]@{
						File       = $file.FullName
						LineNumber = $lineNum
						Line       = $line.Trim()
						Type       = $pattern.TrimEnd(':')
					}
				}
			}
			$lineNum++
		}
	}

	Write-Host "Found $($todoResults.Count) TODO comments in code" -ForegroundColor Yellow

	return [PSCustomObject]@{
		DevDebtFiles = $devDebtFiles
		TodoComments = $todoResults
	}
}

function New-DevDebtFile {
	<#
    .SYNOPSIS
        Creates a new Dev_Debt.md file in the specified directory
    .DESCRIPTION
        Creates a standardized Dev_Debt.md file based on a template
    .PARAMETER Directory
        Directory where the Dev_Debt.md file will be created
    .PARAMETER OverviewText
        Text for the overview section
    .EXAMPLE
        New-DevDebtFile -Directory C:\Projects\MyProject\src -OverviewText "Address performance issues"
    #>
	[CmdletBinding()]
	param (
		[Parameter(Mandatory = $true)]
		[string]$Directory,

		[Parameter(Mandatory = $false)]
		[string]$OverviewText = "Technical debt that needs to be addressed in this directory"
	)

	# Check if directory exists
	if (-not (Test-Path -Path $Directory -PathType Container)) {
		Write-Error "Directory does not exist: $Directory"
		return
	}

	# Path to template
	$templatePath = Join-Path -Path $PSScriptRoot -ChildPath "..\templates\dev-debt\template.md"

	# If template doesn't exist, use embedded template
	if (-not (Test-Path -Path $templatePath)) {
		$templateContent = @"
# Development Debt Document

## Overview
$OverviewText

## Action Items
- [ ] Task 1: [Clear, specific description]
- [ ] Task 2: [Clear, specific description]

## Priority
[High/Medium/Low]

## Estimated Effort
[Hours or story points]

## Implementation Notes
[Any specific implementation details or considerations]

## Acceptance Criteria
- [Criterion 1]
- [Criterion 2]

## Related Files
- [file path relative to this directory]
- [another file path relative to this directory]

## Dependencies
[Any dependencies that need to be resolved first]

## Assigned To
[Developer name or team]
"@
	}
 else {
		# Read template from file
		$templateContent = Get-Content -Path $templatePath -Raw

		# Replace overview placeholder
		$templateContent = $templateContent -replace '\[Brief description of the technical debt this document addresses.*?\]', $OverviewText
	}

	# Output path
	$outputPath = Join-Path -Path $Directory -ChildPath "Dev_Debt.md"

	# Check if file exists
	if (Test-Path -Path $outputPath) {
		$confirmation = Read-Host "Dev_Debt.md already exists in this directory. Overwrite? (y/n)"
		if ($confirmation -ne 'y') {
			Write-Host "Operation cancelled." -ForegroundColor Yellow
			return
		}
	}

	# Write file
	Set-Content -Path $outputPath -Value $templateContent
	Write-Host "Created Dev_Debt.md file at: $outputPath" -ForegroundColor Green
}

function Get-DevDebtSummary {
	<#
    .SYNOPSIS
        Summarizes development debt across the project
    .DESCRIPTION
        Generates a summary of all Dev_Debt.md files and TODO comments
    .PARAMETER Path
        Path to analyze
    .EXAMPLE
        Get-DevDebtSummary -Path C:\Projects\MyProject
    #>
	[CmdletBinding()]
	param (
		[Parameter(Mandatory = $false)]
		[string]$Path = (Get-Location).Path
	)

	# Updated reference to Find-DevDebt (was Scan-DevDebt)
	$scanResults = Find-DevDebt -Path $Path
	$devDebtFiles = $scanResults.DevDebtFiles
	$todoComments = $scanResults.TodoComments

	# Generate summary
	Write-Host "`nDevelopment Debt Summary" -ForegroundColor Cyan
	Write-Host "------------------------" -ForegroundColor Cyan
	Write-Host "Total Dev_Debt.md files: $($devDebtFiles.Count)" -ForegroundColor White
	Write-Host "Total TODO comments: $($todoComments.Count)" -ForegroundColor White

	# Show directories with dev debt files
	if ($devDebtFiles.Count -gt 0) {
		Write-Host "`nDirectories with Dev_Debt.md files:" -ForegroundColor Yellow
		$devDebtFiles | ForEach-Object {
			Write-Host "- $($_.DirectoryName)" -ForegroundColor White
		}
	}

	# Show top files with most TODO comments
	if ($todoComments.Count -gt 0) {
		Write-Host "`nTop files with TODO comments:" -ForegroundColor Yellow
		$todoComments | Group-Object -Property File |
		Sort-Object -Property Count -Descending |
		Select-Object -First 5 |
		ForEach-Object {
			Write-Host "- $($_.Name) ($($_.Count) comments)" -ForegroundColor White
		}
	}

	# Show breakdown by TODO type
	if ($todoComments.Count -gt 0) {
		Write-Host "`nBreakdown by TODO type:" -ForegroundColor Yellow
		$todoComments | Group-Object -Property Type |
		Sort-Object -Property Count -Descending |
		ForEach-Object {
			Write-Host "- $($_.Name): $($_.Count)" -ForegroundColor White
		}
	}
}

# Export functions with updated function name
Export-ModuleMember -Function Find-DevDebt, New-DevDebtFile, Get-DevDebtSummary