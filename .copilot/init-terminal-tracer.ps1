# PowerShell script to initialize terminal tracing

# Ensure we're in the right directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if node modules are installed
if (-not (Test-Path "node_modules")) {
	Write-Host "Installing dependencies..." -ForegroundColor Yellow
	npm install
	if ($LASTEXITCODE -ne 0) {
		Write-Host "Failed to install dependencies!" -ForegroundColor Red
		exit 1
	}
}

# Build the project if not built
if (-not (Test-Path "dist")) {
	Write-Host "Building the project..." -ForegroundColor Yellow
	npm run build
	if ($LASTEXITCODE -ne 0) {
		Write-Host "Failed to build the project!" -ForegroundColor Red
		exit 1
	}
}

# Create trace directory if it doesn't exist
$traceDir = Join-Path $scriptPath "trace"
if (-not (Test-Path $traceDir)) {
	New-Item -ItemType Directory -Path $traceDir | Out-Null
	Write-Host "Created trace directory: $traceDir" -ForegroundColor Green
}

# Import the PowerShell module for command tracing
function Register-TerminalTracing {
	# Create a function to trace commands
	function Trace-Command {
		param(
			[Parameter(Mandatory = $true)]
			[string]$Command
		)

		$nodeExe = Join-Path $scriptPath "dist\cli.js"
		& node $nodeExe execute $Command
	}

	# Set up PSReadLine command history hook if available
	if (Get-Module -ListAvailable -Name PSReadLine) {
		try {
			$null = Register-ObjectEvent -InputObject (Get-PSReadLineOption) -EventName BeforeAccept -Action {
				$command = $_.SourceArgs[0]
				$sessionFile = Join-Path $using:traceDir "current-session.cmd"
				Add-Content -Path $sessionFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $command"
			}
			Write-Host "Terminal tracing enabled with PSReadLine" -ForegroundColor Green
		}
		catch {
			Write-Host "Warning: Could not register PSReadLine hook: $_" -ForegroundColor Yellow
		}
	}

	# Export the function for use
	Export-ModuleMember -Function Trace-Command
}

# Create a module
$moduleContent = @"
# Terminal tracing module
$(Get-Content -Raw -Path $MyInvocation.MyCommand.Path |
  Select-String -Pattern 'function Register-TerminalTracing[\s\S]*?Export-ModuleMember' -AllMatches).Matches.Value

# Execute the registration function
Register-TerminalTracing
"@

$moduleFile = Join-Path $scriptPath "TerminalTracing.psm1"
Set-Content -Path $moduleFile -Value $moduleContent

# Import the module
Import-Module $moduleFile -Force

Write-Host "Terminal tracing system initialized. Use Trace-Command to execute commands with tracing." -ForegroundColor Green
Write-Host "Example: Trace-Command 'dir'" -ForegroundColor Cyan

# Create a convenience function in the current session
function global:tt {
	param(
		[Parameter(ValueFromRemainingArguments = $true)]
		[string[]]$Command
	)

	$fullCommand = $Command -join " "
	Trace-Command $fullCommand
}

Write-Host "Shorthand 'tt' command created. Example: tt dir" -ForegroundColor Cyan