<#
.SYNOPSIS
    Aligns and cleans up the GitHub directory structure for debt management.
.DESCRIPTION
    This script consolidates debt management files, removes redundancies,
    updates references, and ensures all components are properly aligned.
#>

Write-Host "Starting GitHub directory alignment for debt management..." -ForegroundColor Cyan

# Define paths
$githubRoot = Join-Path $PSScriptRoot ".."
$debtManagementRoot = Join-Path $githubRoot "debt-management"
$guidesDir = Join-Path $githubRoot "guides"
$templatesDir = Join-Path $githubRoot "templates"
$reportsDir = Join-Path $githubRoot "reports\dev_debt"
$instructionsDir = Join-Path $githubRoot "instructions"

# Ensure directories exist
$dirsToEnsure = @($guidesDir, $templatesDir, $reportsDir)
foreach ($dir in $dirsToEnsure) {
    if (-not (Test-Path $dir)) {
        Write-Host "Creating directory: $dir" -ForegroundColor Yellow
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
}

# 1. Template Consolidation
Write-Host "Consolidating debt document templates..." -ForegroundColor Green

$primaryTemplatePath = Join-Path $debtManagementRoot "templates\DEVELOPMENT_DEBT_TEMPLATE.md"
$newTemplatePath = Join-Path $templatesDir "dev_debt_template.md"
$instructionsTemplatePath = Join-Path $instructionsDir "format_dev_debt_docs.instructions.md"

# First ensure we have the primary template
if (-not (Test-Path $primaryTemplatePath)) {
    if (Test-Path $instructionsTemplatePath) {
        Write-Host "Using instructions template as primary template" -ForegroundColor Yellow
        Copy-Item -Path $instructionsTemplatePath -Destination $primaryTemplatePath -Force
    } else {
        Write-Host "No source template found! Creating placeholder" -ForegroundColor Red
        @"
# Development Debt Document

## Overview
[Brief description of the technical debt this document addresses]

## Action Items
- [ ] Task 1: [Clear, specific description]
- [ ] Task 2: [Clear, specific description]
- [ ] Task 3: [Clear, specific description]

## Priority
[High/Medium/Low]

## Estimated Effort
[Hours or story points]

## Implementation Notes
[Any specific implementation details or considerations]

## Acceptance Criteria
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

## Related Files
- [file path 1]
- [file path 2]

## Dependencies
[Any dependencies that need to be resolved first]

## Assigned To
[Developer name or team]
"@ | Out-File -FilePath $primaryTemplatePath -Encoding utf8
    }
}

# Copy primary template to templates directory with consistent naming
Copy-Item -Path $primaryTemplatePath -Destination $newTemplatePath -Force
Write-Host "Template consolidated at: $newTemplatePath" -ForegroundColor Green

# 2. Update configuration file references
Write-Host "Updating configuration references..." -ForegroundColor Green
$configPath = Join-Path $debtManagementRoot "config\debt-config.yml"

if (Test-Path $configPath) {
    $configContent = Get-Content -Path $configPath -Raw

    # Update template path references
    $configContent = $configContent -replace '\.github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE\.md', '.github/templates/dev_debt_template.md'

    # Write updated content back
    Set-Content -Path $configPath -Value $configContent -Force
    Write-Host "Updated configuration at: $configPath" -ForegroundColor Green
} else {
    Write-Host "Configuration file not found at: $configPath" -ForegroundColor Red
}

# 3. Update scripts that reference templates
Write-Host "Updating scripts with template references..." -ForegroundColor Green
$scriptsDir = Join-Path $debtManagementRoot "scripts"
$scriptFiles = Get-ChildItem -Path $scriptsDir -Filter "*.sh" -Recurse

foreach ($script in $scriptFiles) {
    $scriptContent = Get-Content -Path $script.FullName -Raw
    $originalContent = $scriptContent

    # Update references in scripts
    $scriptContent = $scriptContent -replace '\.github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE\.md', '.github/templates/dev_debt_template.md'
    $scriptContent = $scriptContent -replace 'debt-report\.md', '.github/reports/dev_debt/debt-report.md'
    $scriptContent = $scriptContent -replace 'debt-weekly-report\.md', '.github/reports/dev_debt/debt-weekly-report.md'

    # Only write back if changes were made
    if ($scriptContent -ne $originalContent) {
        Set-Content -Path $script.FullName -Value $scriptContent -Force
        Write-Host "Updated script: $($script.Name)" -ForegroundColor Green
    }
}

# 4. Create the DIR.TAG template file
$dirTagTemplatePath = Join-Path $templatesDir "DIR.TAG"
if (-not (Test-Path $dirTagTemplatePath)) {
    Write-Host "Creating DIR.TAG template..." -ForegroundColor Green
    @"
// DIR.TAG: #category #priority
// Description of the technical debt issue
// @link: https://github.com/org/repo/issues/123
// @assigned: @username
// @effort: 2h
// @dependencies: path/to/dependency
"@ | Out-File -FilePath $dirTagTemplatePath -Encoding utf8
}

# 5. Ensure all guide files exist and have proper content
Write-Host "Ensuring guide files are complete..." -ForegroundColor Green

$devDebtGuidePath = Join-Path $guidesDir "dev_debt_tagging.md"
if (-not (Test-Path $devDebtGuidePath)) {
    Write-Host "Creating dev_debt_tagging.md guide..." -ForegroundColor Yellow
    @"
# Development Debt Tagging System

## Overview
The DIR.TAG system provides a standardized way to track, categorize, and resolve technical debt through comment-based tagging.

## Tag Format
\`\`\`
// DIR.TAG: #category #priority
// Description of the issue
// @link: https://reference-link-or-documentation
\`\`\`

## Supported Categories
- #architecture - Structural issues requiring redesign
- #performance - Optimizations needed
- #security - Security concerns or vulnerabilities
- #testing - Missing or inadequate test coverage
- #documentation - Missing or outdated documentation
- #accessibility - Accessibility concerns
- #refactor - Code that needs to be reworked
- #dependency - Outdated or problematic dependencies

## Priority Levels
- #p0 - Critical (blocker)
- #p1 - High priority
- #p2 - Medium priority
- #p3 - Low priority

## Automation Integration
The DIR.TAG system integrates with our Jest-based monitoring system:

1. Tags are automatically detected by \`jest --watch\`
2. Changes to tags trigger the automation pipeline
3. Reports are generated in the \`.github/reports/dev_debt\` directory
4. Actionable items appear in the project's GitHub issues
"@ | Out-File -FilePath $devDebtGuidePath -Encoding utf8
}

# 6. Fix path references in documentation
$docsToUpdate = Get-ChildItem -Path $guidesDir -Filter "*.md" -Recurse
foreach ($doc in $docsToUpdate) {
    $docContent = Get-Content -Path $doc.FullName -Raw
    $originalContent = $docContent

    # Update references in docs
    $docContent = $docContent -replace 'debt-report\.md', '.github/reports/dev_debt/debt-report.md'
    $docContent = $docContent -replace 'debt-weekly-report\.md', '.github/reports/dev_debt/debt-weekly-report.md'

    # Only write back if changes were made
    if ($docContent -ne $originalContent) {
        Set-Content -Path $doc.FullName -Value $docContent -Force
        Write-Host "Updated documentation: $($doc.Name)" -ForegroundColor Green
    }
}

# 7. Update workflow files to point to correct locations
$workflowsDir = Join-Path $githubRoot "workflows"
$workflowFiles = Get-ChildItem -Path $workflowsDir -Filter "*.yml" -Include @("*debt*.yml") -Recurse

foreach ($workflow in $workflowFiles) {
    $workflowContent = Get-Content -Path $workflow.FullName -Raw
    $originalContent = $workflowContent

    # Update references in workflows
    $workflowContent = $workflowContent -replace 'debt-report\.md', '.github/reports/dev_debt/debt-report.md'
    $workflowContent = $workflowContent -replace 'debt-weekly-report\.md', '.github/reports/dev_debt/debt-weekly-report.md'
    $workflowContent = $workflowContent -replace '\.github/debt-management/templates/', '.github/templates/'

    # Only write back if changes were made
    if ($workflowContent -ne $originalContent) {
        Set-Content -Path $workflow.FullName -Value $workflowContent -Force
        Write-Host "Updated workflow: $($workflow.Name)" -ForegroundColor Green
    }
}

# 8. Update main DIR.TAG file
$dirTagPath = Join-Path $PSScriptRoot "..\..\DIR.TAG"
if (Test-Path $dirTagPath) {
    $dirTagContent = Get-Content -Path $dirTagPath -Raw
    if ($dirTagContent -eq "#TODO") {
        @"
// DIR.TAG: #documentation #p2
// This file serves as an example of the DIR.TAG tagging system.
// @link: .github/guides/dev_debt_tagging.md
// @assigned: @team
// @effort: 1h
// @dependencies: none
"@ | Out-File -FilePath $dirTagPath -Encoding utf8
        Write-Host "Updated root DIR.TAG example file" -ForegroundColor Green
    }
}

# 9. Remove duplicate template files (only after ensuring we have consolidated)
# First check if both template files exist and have similar content
$duplicateTemplatePaths = @(
    (Join-Path $instructionsDir "format_dev_debt_docs.instructions.md"),
    (Join-Path $debtManagementRoot "templates\DEVELOPMENT_DEBT_TEMPLATE.md")
)

# Calculate primary template hash for comparison
if (Test-Path $newTemplatePath) {
    $primaryContent = (Get-Content -Path $newTemplatePath -Raw).Trim()

    foreach ($dup in $duplicateTemplatePaths) {
        if (Test-Path $dup) {
            $dupContent = (Get-Content -Path $dup -Raw).Trim()

            # If the files are substantially similar (ignoring minor differences),
            # rename with .bak extension instead of deleting
            if (($dupContent -replace "\s+", " ") -like ($primaryContent -replace "\s+", " ")) {
                $backupPath = "$dup.bak"
                if (Test-Path $backupPath) {
                    Remove-Item -Path $backupPath -Force
                }
                Rename-Item -Path $dup -NewName "$dup.bak" -Force
                Write-Host "Backed up redundant template: $dup -> $dup.bak" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "GitHub directory alignment completed!" -ForegroundColor Cyan
Write-Host "Reports will now be generated in: $reportsDir" -ForegroundColor Green
Write-Host "Templates are now consolidated in: $templatesDir" -ForegroundColor Green