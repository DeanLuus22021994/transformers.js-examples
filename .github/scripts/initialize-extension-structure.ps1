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
