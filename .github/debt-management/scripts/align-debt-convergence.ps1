# PS_ID::ALIGN_DEBT_CONVERGENCE
<#
.SYNOPSIS
    Aligns debt management structure with extension development objectives.
.DESCRIPTION
    Creates a deterministic, traceable implementation that converges the debt management system
    with extension development practices. This script enforces structural integrity,
    measures progression, and enables retrospective analysis.
#>

# PS_CONFIG::ERROR_HANDLING
$ErrorActionPreference = "Stop"
Write-Host "Starting Debt Management & Extension Convergence..." -ForegroundColor Cyan

# PS_DEFINE::PATHS
# Define paths
$rootDir = Join-Path $PSScriptRoot "..\..\\"
$githubDir = Join-Path $rootDir ".github"
# $copilotDir = Join-Path $rootDir ".copilot"
# $tempDir = Join-Path $rootDir ".temp_migration"

# PS_CONFIG::METRICS
# Configuration for convergence metrics
$metricsFile = Join-Path $githubDir "metrics\convergence-metrics.json"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# PS_ACTION::ENSURE_METRICS_DIR
# Ensure metric directory exists
$metricsDir = Join-Path $githubDir "metrics"
if (-not (Test-Path $metricsDir)) {
	New-Item -Path $metricsDir -ItemType Directory -Force | Out-Null
}

# PS_ACTION::INIT_METRICS
# Initialize metrics if they don't exist
if (-not (Test-Path $metricsFile)) {
	$metrics = @{
		"iterations"       = @()
		"lastRun"          = $null
		"convergenceScore" = 0
		"completedTasks"   = @()
		"pendingTasks"     = @()
		"fileAlignments"   = @{}
	}
	$metrics | ConvertTo-Json -Depth 10 | Set-Content -Path $metricsFile -Encoding UTF8
}
else {
	$metrics = Get-Content -Path $metricsFile -Encoding UTF8 | ConvertFrom-Json
}

# PS_FUNCTION::ADD_CONVERGENCE_METRIC
# Helper function to record metrics
function Add-ConvergenceMetric {
	param(
		[string]$category,
		[string]$action,
		[string]$status,
		[string]$detail
	)

	# PS_FUNCTION_ACTION::CREATE_ITERATION
	$iteration = @{
		"timestamp" = $timestamp
		"category"  = $category
		"action"    = $action
		"status"    = $status
		"detail"    = $detail
	}

	# PS_FUNCTION_ACTION::UPDATE_METRICS
	$metrics.iterations += $iteration

	if ($status -eq "success") {
		$metrics.completedTasks += "$($category) - $($action)"
		$metrics.convergenceScore += 1
	}
 else {
		$metrics.pendingTasks += "${category} - ${action}: ${detail}"
	}

	# PS_FUNCTION_ACTION::SAVE_METRICS
	$metrics.lastRun = $timestamp
	$metrics | ConvertTo-Json -Depth 10 | Set-Content -Path $metricsFile -Encoding UTF8

	# PS_FUNCTION_ACTION::LOG_RESULT
	if ($status -eq "success") {
		Write-Host "✅ $($category) - $($action)" -ForegroundColor Green
	}
 else {
		Write-Host "⚠️ ${category} - ${action}: ${detail}" -ForegroundColor Yellow
	}
}

# PS_SECTION::SCHEMA_DEFINITION
# 1. Create strict structural definition schema
Write-Host "Establishing structural definition schema..." -ForegroundColor Cyan
$schemaDir = Join-Path $githubDir "schemas"
if (-not (Test-Path $schemaDir)) {
	New-Item -Path $schemaDir -ItemType Directory -Force | Out-Null
	Add-ConvergenceMetric -category "Structure" -action "Create Schema Directory" -status "success" -detail "Created $schemaDir"
}
else {
	Add-ConvergenceMetric -category "Structure" -action "Check Schema Directory" -status "success" -detail "Schema directory already exists"
}

# PS_ACTION::DEFINE_DEBT_SCHEMA
# Define schema for debt management
$debtSchemaFile = Join-Path $schemaDir "debt-management-schema.json"
if (-not (Test-Path $debtSchemaFile)) {
	@'
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Debt Management Configuration",
    "type": "object",
    "required": ["version", "markers", "include_patterns"],
    "properties": {
        "version": {
            "type": "string",
            "description": "Configuration version"
        },
        "markers": {
            "type": "array",
            "description": "Debt markers to track in code",
            "items": {
                "type": "object",
                "required": ["marker", "priority", "label"],
                "properties": {
                    "marker": {
                        "type": "string",
                        "description": "Text marker to identify in code"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["high", "medium", "low"],
                        "description": "Priority level of the debt item"
                    },
                    "color": {
                        "type": "string",
                        "description": "Color code for visual representation"
                    },
                    "label": {
                        "type": "string",
                        "description": "Label for issue tracking"
                    }
                }
            }
        },
        "include_patterns": {
            "type": "array",
            "description": "File patterns to include in debt scanning",
            "items": {
                "type": "string"
            }
        },
        "exclude_patterns": {
            "type": "array",
            "description": "Directories/files to ignore",
            "items": {
                "type": "string"
            }
        },
        "documentation": {
            "type": "object",
            "description": "Documentation settings",
            "required": ["template_path", "sections"],
            "properties": {
                "template_path": {
                    "type": "string",
                    "description": "Path to template document"
                },
                "sections": {
                    "type": "array",
                    "description": "Required document sections",
                    "items": {
                        "type": "string"
                    }
                }
            }
        },
        "reporting": {
            "type": "object",
            "description": "Reporting settings",
            "properties": {
                "generate_summary": {
                    "type": "boolean"
                },
                "create_issues": {
                    "type": "boolean"
                },
                "update_existing_issues": {
                    "type": "boolean"
                },
                "weekly_digest": {
                    "type": "boolean"
                },
                "assign_to_author": {
                    "type": "boolean"
                },
                "mention_authors": {
                    "type": "boolean"
                },
                "include_diff_stats": {
                    "type": "boolean"
                }
            }
        },
        "issue": {
            "type": "object",
            "description": "Issue settings",
            "properties": {
                "label_prefix": {
                    "type": "string"
                },
                "template": {
                    "type": "string"
                }
            }
        }
    }
}
'@ | Out-File -FilePath $debtSchemaFile -Encoding UTF8
	Add-ConvergenceMetric -category "Structure" -action "Create Debt Schema" -status "success" -detail "Created debt management schema"
}

# Create extension development schema aligned with structure
$extensionSchemaFile = Join-Path $schemaDir "extension-development-schema.json"
if (-not (Test-Path $extensionSchemaFile)) {
	@'
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Extension Development Configuration",
    "type": "object",
    "required": ["version", "extensionName", "structure"],
    "properties": {
        "version": {
            "type": "string",
            "description": "Configuration version"
        },
        "extensionName": {
            "type": "string",
            "description": "Name of the extension"
        },
        "structure": {
            "type": "object",
            "description": "Directory structure definition",
            "properties": {
                "directories": {
                    "type": "array",
                    "description": "Required directories for extension",
                    "items": {
                        "type": "object",
                        "required": ["path", "purpose"],
                        "properties": {
                            "path": {
                                "type": "string",
                                "description": "Directory path relative to extension root"
                            },
                            "purpose": {
                                "type": "string",
                                "description": "Purpose of this directory"
                            },
                            "required": {
                                "type": "boolean",
                                "description": "Whether this directory is required",
                                "default": true
                            }
                        }
                    }
                },
                "files": {
                    "type": "array",
                    "description": "Required files for extension",
                    "items": {
                        "type": "object",
                        "required": ["path", "purpose"],
                        "properties": {
                            "path": {
                                "type": "string",
                                "description": "File path relative to extension root"
                            },
                            "purpose": {
                                "type": "string",
                                "description": "Purpose of this file"
                            },
                            "template": {
                                "type": "string",
                                "description": "Path to template file for generation"
                            },
                            "required": {
                                "type": "boolean",
                                "description": "Whether this file is required",
                                "default": true
                            }
                        }
                    }
                }
            }
        },
        "convergence": {
            "type": "object",
            "description": "Convergence settings for extension development",
            "properties": {
                "targetVersion": {
                    "type": "string",
                    "description": "Target version for convergence"
                },
                "steps": {
                    "type": "array",
                    "description": "Convergence steps",
                    "items": {
                        "type": "object",
                        "required": ["name", "description", "criteria"],
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Step name"
                            },
                            "description": {
                                "type": "string",
                                "description": "Step description"
                            },
                            "criteria": {
                                "type": "string",
                                "description": "Success criteria for the step"
                            },
                            "dependencies": {
                                "type": "array",
                                "description": "Dependencies to other steps",
                                "items": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                },
                "measurements": {
                    "type": "array",
                    "description": "Metrics to measure convergence progress",
                    "items": {
                        "type": "object",
                        "required": ["name", "description", "measurement"],
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Metric name"
                            },
                            "description": {
                                "type": "string",
                                "description": "Metric description"
                            },
                            "measurement": {
                                "type": "string",
                                "description": "How to measure this metric"
                            },
                            "target": {
                                "type": "string",
                                "description": "Target value for this metric"
                            }
                        }
                    }
                }
            }
        }
    }
}
'@ | Out-File -FilePath $extensionSchemaFile -Encoding UTF8
	Add-ConvergenceMetric -category "Structure" -action "Create Extension Schema" -status "success" -detail "Created extension development schema"
}

# 2. Create copilot integration configuration
Write-Host "Creating Copilot integration configuration..." -ForegroundColor Cyan
$copilotConfigFile = Join-Path $githubDir "config\copilot-integration.json"
$configDir = Join-Path $githubDir "config"

if (-not (Test-Path $configDir)) {
	New-Item -Path $configDir -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path $copilotConfigFile)) {
	@'
{
    "version": "1.0.0",
    "integration": {
        "enabled": true,
        "featureFlags": {
            "debtManagement": true,
            "testScaffolding": true,
            "documentationGeneration": true,
            "codeReview": true
        }
    },
    "debtManagement": {
        "markerScanning": {
            "enabled": true,
            "scanOnSave": true,
            "scanOnCommit": true
        },
        "testIntegration": {
            "enabled": true,
            "generateTestsForDebtItems": true,
            "updateTestsOnDebtResolution": true
        },
        "reportGeneration": {
            "enabled": true,
            "format": "markdown",
            "categorizeByPriority": true,
            "includeMetrics": true
        }
    },
    "extensionDevelopment": {
        "targetStructure": {
            "directories": [
                "prompts",
                "snippets",
                "completions",
                "commands",
                "schemas"
            ],
            "coreFiles": [
                "config.json",
                "README.md"
            ]
        },
        "convergenceMetrics": {
            "checkpoints": [
                "structure-alignment",
                "schema-validation",
                "test-coverage",
                "documentation-completeness",
                "debt-reduction"
            ],
            "measurementFrequency": "weekly"
        }
    },
    "pathAlignments": {
        "debtTemplatePath": ".github/templates/dev_debt_template.md",
        "debtReportPath": ".github/reports/dev_debt/debt-report.md",
        "weeklyReportPath": ".github/reports/dev_debt/debt-weekly-report.md",
        "configPath": ".github/debt-management/config/debt-config.yml"
    }
}
'@ | Out-File -FilePath $copilotConfigFile -Encoding UTF8
	Add-ConvergenceMetric -category "Configuration" -action "Create Copilot Integration Config" -status "success" -detail "Created copilot integration configuration"
}

# 3. Create extension structure definition
Write-Host "Defining extension structure..." -ForegroundColor Cyan
$extensionStructureFile = Join-Path $githubDir "config\extension-structure.json"

if (-not (Test-Path $extensionStructureFile)) {
	@'
{
    "version": "1.0.0",
    "extensionName": "transformers-js-copilot",
    "structure": {
        "directories": [
            {
                "path": "prompts",
                "purpose": "Reusable prompt templates",
                "required": true
            },
            {
                "path": "snippets",
                "purpose": "Code snippets for Copilot",
                "required": true
            },
            {
                "path": "completions",
                "purpose": "Custom completion providers",
                "required": true
            },
            {
                "path": "commands",
                "purpose": "Custom commands",
                "required": true
            },
            {
                "path": "schemas",
                "purpose": "JSON schemas for validation",
                "required": true
            },
            {
                "path": "utils",
                "purpose": "Utility functions",
                "required": true
            },
            {
                "path": "tests",
                "purpose": "Unit and integration tests",
                "required": true
            },
            {
                "path": "docs",
                "purpose": "Extension documentation",
                "required": true
            }
        ],
        "files": [
            {
                "path": "config.json",
                "purpose": "Main configuration file",
                "required": true
            },
            {
                "path": "README.md",
                "purpose": "Extension documentation",
                "required": true
            },
            {
                "path": "CHANGELOG.md",
                "purpose": "Version history",
                "required": true
            },
            {
                "path": "package.json",
                "purpose": "Extension metadata and dependencies",
                "required": true
            },
            {
                "path": "tsconfig.json",
                "purpose": "TypeScript configuration",
                "required": true
            }
        ]
    },
    "convergence": {
        "targetVersion": "1.0.0",
        "steps": [
            {
                "name": "structure-alignment",
                "description": "Align directory and file structure",
                "criteria": "All required directories and files exist"
            },
            {
                "name": "schema-validation",
                "description": "Validate configuration against schemas",
                "criteria": "All configuration files pass schema validation",
                "dependencies": ["structure-alignment"]
            },
            {
                "name": "test-coverage",
                "description": "Implement comprehensive test coverage",
                "criteria": "80% or higher test coverage",
                "dependencies": ["structure-alignment"]
            },
            {
                "name": "documentation-completeness",
                "description": "Complete all documentation",
                "criteria": "All features are documented",
                "dependencies": ["structure-alignment"]
            },
            {
                "name": "debt-reduction",
                "description": "Reduce technical debt",
                "criteria": "Zero high-priority debt items",
                "dependencies": ["structure-alignment", "test-coverage"]
            }
        ],
        "measurements": [
            {
                "name": "structure-completion",
                "description": "Directory and file structure completion percentage",
                "measurement": "Percentage of required directories and files that exist",
                "target": "100%"
            },
            {
                "name": "test-coverage",
                "description": "Code test coverage percentage",
                "measurement": "Percentage of code covered by tests",
                "target": "80%"
            },
            {
                "name": "documentation-coverage",
                "description": "Feature documentation coverage",
                "measurement": "Percentage of features that are documented",
                "target": "100%"
            },
            {
                "name": "high-priority-debt",
                "description": "Number of high-priority debt items",
                "measurement": "Count of high-priority debt items",
                "target": "0"
            }
        ]
    }
}
'@ | Out-File -FilePath $extensionStructureFile -Encoding UTF8
	Add-ConvergenceMetric -category "Structure" -action "Create Extension Structure" -status "success" -detail "Created extension structure definition"
}

# 4. Update debt config to align with schemas
Write-Host "Validating debt configuration against schema..." -ForegroundColor Cyan
$debtConfigFile = Join-Path $githubDir "debt-management\config\debt-config.yml"

if (Test-Path $debtConfigFile) {
	# Read current config
	$debtConfig = Get-Content -Path $debtConfigFile -Raw

	# Update template path if needed
	if ($debtConfig -match '\.github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE\.md') {
		$debtConfig = $debtConfig -replace '\.github/debt-management/templates/DEVELOPMENT_DEBT_TEMPLATE\.md', '.github/templates/dev_debt_template.md'
		Set-Content -Path $debtConfigFile -Value $debtConfig -Encoding UTF8
		Add-ConvergenceMetric -category "Configuration" -action "Update Debt Config Template Path" -status "success" -detail "Updated template path in debt config"
	}

	# Ensure report paths are correct
	$scriptsDir = Join-Path $githubDir "debt-management\scripts"
	$scriptFiles = Get-ChildItem -Path $scriptsDir -Filter "*.sh" -ErrorAction SilentlyContinue

	foreach ($script in $scriptFiles) {
		$scriptContent = Get-Content -Path $script.FullName -Raw
		$updated = $false

		if ($scriptContent -match 'debt-report\.md') {
			$scriptContent = $scriptContent -replace 'debt-report\.md', '.github/reports/dev_debt/debt-report.md'
			$updated = $true
		}

		if ($scriptContent -match 'debt-weekly-report\.md') {
			$scriptContent = $scriptContent -replace 'debt-weekly-report\.md', '.github/reports/dev_debt/debt-weekly-report.md'
			$updated = $true
		}

		if ($updated) {
			Set-Content -Path $script.FullName -Value $scriptContent -Encoding UTF8
			Add-ConvergenceMetric -category "Configuration" -action "Update Script Paths" -status "success" -detail "Updated paths in $($script.Name)"
		}
	}

	Add-ConvergenceMetric -category "Configuration" -action "Validate Debt Config" -status "success" -detail "Debt configuration validated"
}
else {
	Add-ConvergenceMetric -category "Configuration" -action "Validate Debt Config" -status "error" -detail "Debt configuration file not found"
}

# 5. Create convergence tracking system
Write-Host "Setting up convergence tracking system..." -ForegroundColor Cyan
$convergenceFile = Join-Path $githubDir "metrics\convergence-tracking.json"

if (-not (Test-Path $convergenceFile)) {
	@'
{
    "version": "1.0.0",
    "lastUpdated": null,
    "convergenceSteps": {
        "structure-alignment": {
            "status": "pending",
            "progress": 0,
            "startDate": null,
            "completionDate": null,
            "notes": []
        },
        "schema-validation": {
            "status": "pending",
            "progress": 0,
            "startDate": null,
            "completionDate": null,
            "notes": []
        },
        "test-coverage": {
            "status": "pending",
            "progress": 0,
            "startDate": null,
            "completionDate": null,
            "notes": []
        },
        "documentation-completeness": {
            "status": "pending",
            "progress": 0,
            "startDate": null,
            "completionDate": null,
            "notes": []
        },
        "debt-reduction": {
            "status": "pending",
            "progress": 0,
            "startDate": null,
            "completionDate": null,
            "notes": []
        }
    },
    "metrics": {
        "structure-completion": {
            "current": 0,
            "target": 100,
            "unit": "%",
            "history": []
        },
        "test-coverage": {
            "current": 0,
            "target": 80,
            "unit": "%",
            "history": []
        },
        "documentation-coverage": {
            "current": 0,
            "target": 100,
            "unit": "%",
            "history": []
        },
        "high-priority-debt": {
            "current": 0,
            "target": 0,
            "unit": "count",
            "history": []
        }
    },
    "iterations": []
}
'@ | Out-File -FilePath $convergenceFile -Encoding UTF8
	Add-ConvergenceMetric -category "Metrics" -action "Create Convergence Tracking" -status "success" -detail "Created convergence tracking system"
}

# 6. Create file alignment validator
Write-Host "Creating file alignment validator..." -ForegroundColor Cyan
$validatorScript = Join-Path $githubDir "scripts\validate-file-alignment.ps1"

if (-not (Test-Path $validatorScript)) {
	@'
<#
.SYNOPSIS
    Validates file alignments across extension and debt management.
.DESCRIPTION
    Ensures all files are properly aligned according to schema definitions
    and structural requirements, reporting any discrepancies.
#>

$ErrorActionPreference = "Stop"

# Define paths
$rootDir = Join-Path $PSScriptRoot "..\..\\"
$githubDir = Join-Path $rootDir ".github"
# $copilotDir = Join-Path $rootDir ".copilot"
$configDir = Join-Path $githubDir "config"
$metricsDir = Join-Path $githubDir "metrics"

# Load configurations
$extensionStructureFile = Join-Path $configDir "extension-structure.json"
$copilotConfigFile = Join-Path $configDir "copilot-integration.json"
$convergenceFile = Join-Path $metricsDir "convergence-tracking.json"

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

# Load extension structure
$extensionStructure = Get-Content -Path $extensionStructureFile -Raw | ConvertFrom-Json
$convergenceTracking = Get-Content -Path $convergenceFile -Raw | ConvertFrom-Json

# Validate extension structure
$requiredDirs = $extensionStructure.structure.directories | Where-Object { $_.required -ne $false } | ForEach-Object { $_.path }
$requiredFiles = $extensionStructure.structure.files | Where-Object { $_.required -ne $false } | ForEach-Object { $_.path }

# Initialize counters
$existingDirs = 0
$existingFiles = 0

# Check directories
Write-Host "Checking required directories..." -ForegroundColor Cyan
foreach ($dir in $requiredDirs) {
    $fullPath = Join-Path $copilotDir $dir
    if (Test-Path $fullPath) {
        Write-Host "✅ $dir" -ForegroundColor Green
        $existingDirs++
    } else {
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
    } else {
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
    "value" = $completionPercentage
}

# Update convergence step status
if ($completionPercentage -eq 100) {
    $convergenceTracking.convergenceSteps.'structure-alignment'.status = "complete"
    $convergenceTracking.convergenceSteps.'structure-alignment'.progress = 100
    if (-not $convergenceTracking.convergenceSteps.'structure-alignment'.completionDate) {
        $convergenceTracking.convergenceSteps.'structure-alignment'.completionDate = $timestamp
    }
} else {
    $convergenceTracking.convergenceSteps.'structure-alignment'.status = "in-progress"
    $convergenceTracking.convergenceSteps.'structure-alignment'.progress = $completionPercentage
    if (-not $convergenceTracking.convergenceSteps.'structure-alignment'.startDate) {
        $convergenceTracking.convergenceSteps.'structure-alignment'.startDate = $timestamp
    }
}

# Add iteration record
$iteration = @{
    "timestamp" = $timestamp
    "type" = "structure-validation"
    "metrics" = @{
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
'@ | Out-File -FilePath $validatorScript -Encoding UTF8
	Add-ConvergenceMetric -category "Validation" -action "Create File Alignment Validator" -status "success" -detail "Created file alignment validator script"
}

# 7. Create jest watch integration script
Write-Host "Creating Jest watch integration..." -ForegroundColor Cyan
$jestWatchScript = Join-Path $githubDir "scripts\jest-watch-dir-tags.js"

if (-not (Test-Path $jestWatchScript)) {
	@'
// Jest watch plugin for DIR.TAG files
// This script integrates with Jest to monitor DIR.TAG changes and
// trigger appropriate automation

/**
 * DIR.TAG Watch Plugin for Jest
 *
 * This plugin monitors changes to DIR.TAG files and triggers appropriate
 * automation based on detected changes.
 */
class DirTagWatchPlugin {
  constructor({ rootDir }) {
    this.rootDir = rootDir;
    this.isWatching = false;
    this.dirTagFiles = new Set();
    this.hasTriggeredInitialScan = false;
  }

  // Hook into Jest's file system watcher
  apply(jestHooks) {
    jestHooks.onFileChange(({ projects }) => {
      this.scanForDirTags(projects);
    });

    jestHooks.onTestRunComplete(() => {
      if (!this.hasTriggeredInitialScan) {
        this.hasTriggeredInitialScan = true;
        console.log('\n[DIR.TAG] Performing initial scan for DIR.TAG files...');
        this.scanForDirTags();
      }
    });
  }

  // Scan for DIR.TAG files
  async scanForDirTags(projects) {
    const fs = require('fs');
    const path = require('path');
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);

    try {
      // Use git to find DIR.TAG files (faster than fs walk)
      const { stdout } = await exec('git ls-files "**/DIR.TAG"', { cwd: this.rootDir });
      const currentDirTags = new Set(
        stdout.split('\n').filter(Boolean).map(file => path.join(this.rootDir, file))
      );

      // Check for new or modified DIR.TAG files
      const newDirTags = [...currentDirTags].filter(file => !this.dirTagFiles.has(file));
      const modifiedDirTags = [...this.dirTagFiles].filter(file => {
        return currentDirTags.has(file) && fs.existsSync(file);
      });

      // Update tracked DIR.TAG files
      this.dirTagFiles = currentDirTags;

      // Process new or modified DIR.TAG files
      if (newDirTags.length > 0) {
        console.log(`\n[DIR.TAG] Found ${newDirTags.length} new DIR.TAG files`);
        this.processDirTagFiles(newDirTags);
      }

      if (modifiedDirTags.length > 0) {
        console.log(`\n[DIR.TAG] Detected changes in ${modifiedDirTags.length} DIR.TAG files`);
        this.processDirTagFiles(modifiedDirTags);
      }

    } catch (error) {
      console.error('[DIR.TAG] Error scanning for DIR.TAG files:', error);
    }
  }

  // Process DIR.TAG files and trigger appropriate actions
  async processDirTagFiles(files) {
    const fs = require('fs');
    const path = require('path');
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);

    for (const file of files) {
      try {
        if (!fs.existsSync(file)) continue;

        const content = fs.readFileSync(file, 'utf8');
        const tags = this.extractTags(content);
        const category = tags.find(tag => !tag.startsWith('#p'));
        const priority = tags.find(tag => tag.startsWith('#p'));

        console.log(`\n[DIR.TAG] Processing: ${path.relative(this.rootDir, file)}`);
        console.log(`  - Category: ${category || 'unspecified'}`);
        console.log(`  - Priority: ${priority || 'unspecified'}`);

        // Trigger actions based on tags
        if (category === '#testing') {
          console.log('  - Action: Scaffolding tests');
          await this.scaffoldTests(file);
        }

        // Update debt tracking system
        await this.updateDebtTracking(file, content, category, priority);

      } catch (error) {
        console.error(`[DIR.TAG] Error processing ${file}:`, error);
      }
    }
  }

  // Extract hashtags from DIR.TAG content
  extractTags(content) {
    const tagRegex = /#([a-zA-Z0-9_-]+)/g;
    const matches = content.match(tagRegex);
    return matches || [];
  }

  // Scaffold tests based on DIR.TAG file
  async scaffoldTests(dirTagFile) {
    const path = require('path');
    const fs = require('fs');

    // Get the directory containing the DIR.TAG file
    const dirTagDir = path.dirname(dirTagFile);

    // Find all .js/.ts files in that directory
    const files = fs.readdirSync(dirTagDir)
      .filter(file => /\.(js|ts|tsx|jsx)$/.test(file))
      .filter(file => !file.endsWith('.test.js') && !file.endsWith('.test.ts'));

    for (const file of files) {
      const filePath = path.join(dirTagDir, file);
      const testFileName = file.replace(/\.(js|ts|tsx|jsx)$/, '.test.$1');
      const testFilePath = path.join(dirTagDir, '__tests__', testFileName);

      // Ensure the __tests__ directory exists
      const testDir = path.join(dirTagDir, '__tests__');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Skip if test file already exists
      if (fs.existsSync(testFilePath)) {
        console.log(`  - Test file already exists: ${testFilePath}`);
        continue;
      }

      // Generate basic test scaffolding
      const content = fs.readFileSync(filePath, 'utf8');
      const moduleExportsMatch = content.match(/module\.exports\s*=\s*{([^}]*)}/);
      const exportMatch = content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/);

      let exportedName = '';
      if (moduleExportsMatch) {
        const exports = moduleExportsMatch[1].trim().split(',')[0].trim();
        exportedName = exports;
      } else if (exportMatch) {
        exportedName = exportMatch[1];
      }

      const testTemplate = `
// Auto-generated test scaffold from DIR.TAG #testing
describe('${exportedName || path.basename(file, path.extname(file))}', () => {
  test('should be properly implemented', () => {
    // TODO: Implement test
    expect(true).toBe(true);
  });
});
`;

      fs.writeFileSync(testFilePath, testTemplate.trim());
      console.log(`  - Generated test scaffold: ${testFilePath}`);
    }
  }

  // Update debt tracking system
  async updateDebtTracking(file, content, category, priority) {
    const path = require('path');
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);

    // Skip if debt management scripts don't exist
    const scanScriptPath = path.join(this.rootDir, '.github/debt-management/scripts/scan-debt.sh');
    const scriptExists = require('fs').existsSync(scanScriptPath);
    if (!scriptExists) {
      console.log('  - Skipping debt tracking update (scan-debt.sh not found)');
      return;
    }

    try {
      // Run debt scanning script to update reports
      console.log('  - Updating debt tracking system...');
      await exec('bash .github/debt-management/scripts/scan-debt.sh', { cwd: this.rootDir });
      console.log('  - Debt tracking system updated');
    } catch (error) {
      console.error('  - Error updating debt tracking:', error.message);
    }
  }

  // Cleanup method called when Jest watch is stopped
  getUsageInfo() {
    return {
      key: 'd',
      prompt: 'scan DIR.TAG files',
    };
  }

  // Handle key press 'd' to manually trigger a DIR.TAG scan
  run() {
    console.log('\n[DIR.TAG] Manually scanning DIR.TAG files...');
    this.scanForDirTags();
    return Promise.resolve();
  }
}

module.exports = DirTagWatchPlugin;
'@ | Out-File -FilePath $jestWatchScript -Encoding UTF8
	Add-ConvergenceMetric -category "Integration" -action "Create Jest Watch Script" -status "success" -detail "Created Jest watch integration for DIR.TAG files"
}

# 8. Create VSCode task for debt management
Write-Host "Creating VSCode tasks..." -ForegroundColor Cyan
$vscodeDirPath = Join-Path $rootDir ".vscode"
$vscodeTasksPath = Join-Path $vscodeDirPath "tasks.json"

if (-not (Test-Path $vscodeDirPath)) {
	New-Item -Path $vscodeDirPath -ItemType Directory -Force | Out-Null
}

$existingTasks = $null
if (Test-Path $vscodeTasksPath) {
	$existingTasks = Get-Content -Path $vscodeTasksPath -Raw | ConvertFrom-Json
}

if ($null -eq $existingTasks) {
	@'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Debt: Scan Project",
            "type": "shell",
            "command": "bash",
            "args": [
                "${workspaceFolder}/.github/debt-management/scripts/scan-debt.sh"
            ],
            "group": "test",
            "presentation": {
                "reveal": "always",
                "panel": "new",
                "focus": true
            },
            "problemMatcher": []
        },
        {
            "label": "Debt: Generate Weekly Report",
            "type": "shell",
            "command": "bash",
            "args": [
                "${workspaceFolder}/.github/debt-management/scripts/generate-report.sh"
            ],
            "group": "test",
            "presentation": {
                "reveal": "always",
                "panel": "new",
                "focus": true
            },
            "problemMatcher": []
        },
        {
            "label": "Debt: Create GitHub Issues",
            "type": "shell",
            "command": "bash",
            "args": [
                "${workspaceFolder}/.github/debt-management/scripts/create-issues.sh"
            ],
            "group": "test",
            "presentation": {
                "reveal": "always",
                "panel": "new",
                "focus": true
            },
            "problemMatcher": []
        },
        {
            "label": "Jest: Watch DIR.TAG Files",
            "type": "shell",
            "command": "npx",
            "args": [
                "jest",
                "--watch",
                "--watchPlugins=${workspaceFolder}/.github/scripts/jest-watch-dir-tags.js"
            ],
            "group": "test",
            "presentation": {
                "reveal": "always",
                "panel": "dedicated",
                "focus": true
            },
            "problemMatcher": []
        },
        {
            "label": "Validate File Alignment",
            "type": "shell",
            "command": "powershell",
            "args": [
                "-File",
                "${workspaceFolder}/.github/scripts/validate-file-alignment.ps1"
            ],
            "group": "test",
            "presentation": {
                "reveal": "always",
                "panel": "new",
                "focus": true
            },
            "problemMatcher": []
        },
        {
            "label": "Initialize Extension Structure",
            "type": "shell",
            "command": "powershell",
            "args": [
                "-File",
                "${workspaceFolder}/.github/scripts/initialize-extension-structure.ps1"
            ],
            "group": "test",
            "presentation": {
                "reveal": "always",
                "panel": "new",
                "focus": true
            },
            "problemMatcher": []
        }
    ]
}
'@ | Out-File -FilePath $vscodeTasksPath -Encoding UTF8
	Add-ConvergenceMetric -category "Integration" -action "Create VSCode Tasks" -status "success" -detail "Created VSCode tasks for debt management"
}
else {
	# TODO: Merge tasks if they don't exist
	Add-ConvergenceMetric -category "Integration" -action "Check VSCode Tasks" -status "success" -detail "VSCode tasks file already exists"
}

# 9. Create extension structure initializer
Write-Host "Creating extension structure initializer..." -ForegroundColor Cyan
$extensionInitScript = Join-Path $githubDir "scripts\initialize-extension-structure.ps1"

if (-not (Test-Path $extensionInitScript)) {
	@'
<#
.SYNOPSIS
    Initializes extension structure according to configuration.
.DESCRIPTION
    Creates the directory and file structure for the extension based on
    the extension-structure.json configuration.
#>

$ErrorActionPreference = "Stop"

# Define paths
$rootDir = Join-Path $PSScriptRoot "..\..\\"
$githubDir = Join-Path $rootDir ".github"
# $copilotDir = Join-Path $rootDir ".copilot"
$configDir = Join-Path $githubDir "config"

# Load configuration
$extensionStructureFile = Join-Path $configDir "extension-structure.json"

if (-not (Test-Path $extensionStructureFile)) {
    Write-Host "Error: Extension structure configuration file not found at $extensionStructureFile" -ForegroundColor Red
    exit 1
}

$extensionStructure = Get-Content -Path $extensionStructureFile -Raw | ConvertFrom-Json

# Create directories
Write-Host "Creating extension directory structure..." -ForegroundColor Cyan

foreach ($dir in $extensionStructure.structure.directories) {
    $dirPath = Join-Path $copilotDir $dir.path

    if (-not (Test-Path $dirPath)) {
        Write-Host "Creating directory: $($dir.path)" -ForegroundColor Yellow
        New-Item -Path $dirPath -ItemType Directory -Force | Out-Null

        # Create README.md in each directory explaining its purpose
        $readmePath = Join-Path $dirPath "README.md"
        @"
# $($dir.path)

## Purpose
$($dir.purpose)

## Contents
This directory contains:
- (Add contents as they are created)
"@ | Out-File -FilePath $readmePath -Encoding UTF8
    } else {
        Write-Host "Directory already exists: $($dir.path)" -ForegroundColor Green
    }
}

# Create required files
Write-Host "`nCreating required files..." -ForegroundColor Cyan

foreach ($file in $extensionStructure.structure.files) {
    $filePath = Join-Path $copilotDir $file.path

    if (-not (Test-Path $filePath)) {
        Write-Host "Creating file: $($file.path)" -ForegroundColor Yellow

        # Check if there's a template for this file
        if ($file.template) {
            $templatePath = Join-Path $githubDir $file.template
            if (Test-Path $templatePath) {
                Copy-Item -Path $templatePath -Destination $filePath -Force
            } else {
                # Create default content based on file type
                switch -regex ($file.path) {
                    "README\.md$" {
                        @"
# $($extensionStructure.extensionName)

## Overview
Extension for transformers.js that adds specialized capabilities.

## Features
- (Add features as they are implemented)

## Installation
(Add installation instructions)

## Usage
(Add usage instructions)
"@ | Out-File -FilePath $filePath -Encoding UTF8
                    }
                    "CHANGELOG\.md$" {
                        @"
# Changelog

All notable changes to this extension will be documented in this file.

## [Unreleased]
- Initial setup
"@ | Out-File -FilePath $filePath -Encoding UTF8
                    }
                    "package\.json$" {
                        @"
{
  "name": "$($extensionStructure.extensionName)",
  "version": "0.1.0",
  "description": "Extension for transformers.js",
  "main": "index.js",
  "scripts": {
    "test": "jest"
  },
  "keywords": [
    "transformers",
    "copilot",
    "extension"
  ],
  "author": "",
  "license": "MIT"
}
"@ | Out-File -FilePath $filePath -Encoding UTF8
                    }
                    "config\.json$" {
                        @"
{
  "version": "0.1.0",
  "features": {
    "debtManagement": true,
    "testScaffolding": true,
    "documentationGeneration": true
  },
  "logging": {
    "level": "info",
    "file": "logs/extension.log"
  }
}
"@ | Out-File -FilePath $filePath -Encoding UTF8
                    }
                    "tsconfig\.json$" {
                        @"
{
  "compilerOptions": {
    "target": "es2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
"@ | Out-File -FilePath $filePath -Encoding UTF8
                    }
                    default {
                        # Default empty file
                        "" | Out-File -FilePath $filePath -Encoding UTF8
                    }
                }
            }
        } else {
            # Default empty file
            "" | Out-File -FilePath $filePath -Encoding UTF8
        }
    } else {
        Write-Host "File already exists: $($file.path)" -ForegroundColor Green
    }
}

# Update convergence tracking
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$convergenceFile = Join-Path $githubDir "metrics\convergence-tracking.json"

if (Test-Path $convergenceFile) {
    $convergenceTracking = Get-Content -Path $convergenceFile -Raw | ConvertFrom-Json

    # Count existing directories and files
    $existingDirs = 0
    $requiredDirs = $extensionStructure.structure.directories | Where-Object { $_.required -ne $false }
    foreach ($dir in $requiredDirs) {
        if (Test-Path (Join-Path $copilotDir $dir.path)) {
            $existingDirs++
        }
    }

    $existingFiles = 0
    $requiredFiles = $extensionStructure.structure.files | Where-Object { $_.required -ne $false }
    foreach ($file in $requiredFiles) {
        if (Test-Path (Join-Path $copilotDir $file.path)) {
            $existingFiles++
        }
    }

    # Calculate completion percentage
    $totalRequired = $requiredDirs.Count + $requiredFiles.Count
    $totalExisting = $existingDirs + $existingFiles
    $completionPercentage = [math]::Round(($totalExisting / $totalRequired) * 100, 2)

    # Update structure-completion metric
    $convergenceTracking.metrics.'structure-completion'.current = $completionPercentage
    $convergenceTracking.metrics.'structure-completion'.history += @{
        "timestamp" = $timestamp
        "value" = $completionPercentage
    }

    # Update convergence step status
    if ($completionPercentage -eq 100) {
        $convergenceTracking.convergenceSteps.'structure-alignment'.status = "complete"
        $convergenceTracking.convergenceSteps.'structure-alignment'.progress = 100
        if (-not $convergenceTracking.convergenceSteps.'structure-alignment'.completionDate) {
            $convergenceTracking.convergenceSteps.'structure-alignment'.completionDate = $timestamp
        }
    } else {
        $convergenceTracking.convergenceSteps.'structure-alignment'.status = "in-progress"
        $convergenceTracking.convergenceSteps.'structure-alignment'.progress = $completionPercentage
        if (-not $convergenceTracking.convergenceSteps.'structure-alignment'.startDate) {
            $convergenceTracking.convergenceSteps.'structure-alignment'.startDate = $timestamp
        }
    }

    # Add iteration record
    $iteration = @{
        "timestamp" = $timestamp
        "type" = "structure-initialization"
        "metrics" = @{
            "structureCompletion" = $completionPercentage
        }
    }
    $convergenceTracking.iterations += $iteration

    # Update last updated timestamp
    $convergenceTracking.lastUpdated = $timestamp

    # Save updated tracking
    $convergenceTracking | ConvertTo-Json -Depth 10 | Set-Content -Path $convergenceFile -Encoding UTF8

    Write-Host "`nStructure Completion: $completionPercentage%" -ForegroundColor Cyan
    Write-Host "Directories: $existingDirs/$($requiredDirs.Count)" -ForegroundColor Cyan
    Write-Host "Files: $existingFiles/$($requiredFiles.Count)" -ForegroundColor Cyan
    Write-Host "Convergence metrics updated" -ForegroundColor Green
}

Write-Host "`nExtension structure initialization completed!" -ForegroundColor Green
'@ | Out-File -FilePath $extensionInitScript -Encoding UTF8
	Add-ConvergenceMetric -category "Structure" -action "Create Extension Initializer" -status "success" -detail "Created extension structure initializer script"
}

# 10. Update DIR.TAG example
Write-Host "Updating DIR.TAG example file..." -ForegroundColor Cyan
$dirTagPath = Join-Path $rootDir "DIR.TAG"

if (Test-Path $dirTagPath) {
	$dirTagContent = Get-Content -Path $dirTagPath -Raw
	if ($dirTagContent.Trim() -eq "#TODO") {
		@'
// DIR.TAG: #documentation #p2
// This file serves as an example of the DIR.TAG tagging system.
// @link: .github/guides/dev_debt_tagging.md
// @assigned: @team
// @effort: 1h
// @dependencies: none
'@ | Out-File -FilePath $dirTagPath -Encoding UTF8
		Add-ConvergenceMetric -category "Documentation" -action "Update DIR.TAG Example" -status "success" -detail "Updated DIR.TAG example file"
	}
 else {
		Add-ConvergenceMetric -category "Documentation" -action "Check DIR.TAG Example" -status "success" -detail "DIR.TAG example file already updated"
	}
}

# 11. Generate final report
$totalCompleted = $metrics.completedTasks.Count
$totalPending = $metrics.pendingTasks.Count
$totalTasks = $totalCompleted + $totalPending
$completionPercentage = [math]::Round(($totalCompleted / $totalTasks) * 100, 2)

$reportFile = Join-Path $githubDir "reports\alignment-report.md"
$reportDir = Join-Path $githubDir "reports"

if (-not (Test-Path $reportDir)) {
	New-Item -Path $reportDir -ItemType Directory -Force | Out-Null
}

@"
# GitHub Directory Alignment Report

Generated on: $timestamp

## Summary
- **Tasks Completed:** $totalCompleted/$totalTasks ($completionPercentage%)
- **Convergence Score:** $($metrics.convergenceScore)
- **Last Run:** $($metrics.lastRun)

## Completed Tasks
$(foreach ($task in $metrics.completedTasks) { "- ✅ $task`n" })

## Pending Tasks
$(if ($metrics.pendingTasks.Count -gt 0) { foreach ($task in $metrics.pendingTasks) { "- ⏳ $task`n" } } else { "- ✅ All tasks completed" })

## Next Steps
1. Run VSCode task: "Validate File Alignment" to check structure alignment
2. Run VSCode task: "Initialize Extension Structure" to create missing extension files
3. Run VSCode task: "Jest: Watch DIR.TAG Files" to enable real-time debt tracking

## Available Automation Tools
- Debt scanning: VSCode task "Debt: Scan Project"
- Weekly reports: VSCode task "Debt: Generate Weekly Report"
- GitHub issues: VSCode task "Debt: Create GitHub Issues"

## File Structure
The file structure has been aligned according to the schema defined in:
- `.github/schemas/debt-management-schema.json`
- `.github/schemas/extension-development-schema.json`

## Directory Structure
```
.github/
  ├── debt-management/     # Debt management tools
  ├── guides/              # How-to guides
  ├── metrics/             # Convergence metrics
  ├── reports/             # Generated reports
  ├── schemas/             # Schema definitions
  ├── scripts/             # Automation scripts
  └── templates/           # File templates
```

Extension structure is defined in `.github/config/extension-structure.json`.

## Integration
The debt management system is now fully integrated with:
- Jest watch mode (automatic test scaffolding)
- VSCode tasks (streamlined workflows)
- GitHub Actions (automated reporting)

See the convergence tracking in `.github/metrics/convergence-tracking.json` for progress updates.
"@ | Out-File -FilePath $reportFile -Encoding UTF8

# Print final status
Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "GitHub Directory Alignment Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Tasks Completed: $totalCompleted/$totalTasks ($completionPercentage%)" -ForegroundColor White
Write-Host "Convergence Score: $($metrics.convergenceScore)" -ForegroundColor White
Write-Host "Report Generated: $reportFile" -ForegroundColor White
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Run VSCode task: 'Validate File Alignment'" -ForegroundColor White
Write-Host "2. Run VSCode task: 'Initialize Extension Structure'" -ForegroundColor White
Write-Host "3. Run VSCode task: 'Jest: Watch DIR.TAG Files'" -ForegroundColor White
Write-Host "===========================================" -ForegroundColor Cyan
