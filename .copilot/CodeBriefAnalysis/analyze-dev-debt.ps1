<#
.SYNOPSIS
    Analyzes development debt in the project
.DESCRIPTION
    Runs a complete scan of the project to identify and summarize development debt
.EXAMPLE
    .\analyze-dev-debt.ps1
#>

# Import module
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module "$scriptPath\Dev-Debt.psm1" -Force

# Set project root
$projectRoot = (Get-Item $scriptPath).Parent.Parent.FullName

Write-Host "Analyzing development debt in: $projectRoot" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Run analysis
Get-DevDebtSummary -Path $projectRoot

# Output report
$outputDir = Join-Path -Path $projectRoot -ChildPath "reports\dev-debt"
if (-not (Test-Path -Path $outputDir)) {
    New-Item -Path $outputDir -ItemType Directory | Out-Null
}

$reportPath = Join-Path -Path $outputDir -ChildPath "dev-debt-report-$(Get-Date -Format 'yyyy-MM-dd').json"
$scanResults = Scan-DevDebt -Path $projectRoot

# Create report object
$report = [PSCustomObject]@{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    ProjectPath = $projectRoot
    DevDebtFiles = @($scanResults.DevDebtFiles | Select-Object FullName, LastWriteTime, DirectoryName)
    TodoComments = @($scanResults.TodoComments | Select-Object File, LineNumber, Type, Line)
    Summary = [PSCustomObject]@{
        TotalDevDebtFiles = $scanResults.DevDebtFiles.Count
        TotalTodoComments = $scanResults.TodoComments.Count
        ByTodoType = @($scanResults.TodoComments | Group-Object -Property Type | Select-Object Name, Count)
        TopFiles = @($scanResults.TodoComments | Group-Object -Property File | Sort-Object -Property Count -Descending | Select-Object -First 10 | Select-Object Name, Count)
    }
}

# Save report
$report | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath

Write-Host "`nDevelopment debt report saved to: $reportPath" -ForegroundColor Green