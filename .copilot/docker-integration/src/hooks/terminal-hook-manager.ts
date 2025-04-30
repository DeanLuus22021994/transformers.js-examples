import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../utils/config-manager';

/**
 * TerminalHookManager class that manages hooks to initialize Docker on terminal startup
 * Follows SRP by focusing only on terminal hook management
 */
export class TerminalHookManager {
  private logger: Logger;
  private configManager: ConfigManager;
  private hooksInstalled: boolean = false;
  private hookScriptPath: string;

  constructor(logger: Logger, configManager: ConfigManager) {
    this.logger = logger;
    this.configManager = configManager;

    // Set hook script path
    this.hookScriptPath = path.join(os.homedir(), '.transformers-docker', 'terminal-hooks');

    // Create hook script directory if it doesn't exist
    if (!fs.existsSync(this.hookScriptPath)) {
      fs.mkdirSync(this.hookScriptPath, { recursive: true });
    }
  }

  /**
   * Register terminal hooks to run Docker initialization on terminal startup
   */
  public async registerHooks(): Promise<boolean> {
    try {
      this.logger.info('TerminalHookManager', 'Registering terminal hooks');

      // Generate hook scripts for different shells
      this.generatePowerShellHook();
      this.generateBashHook();

      // Install hooks for current shell
      await this.installCurrentShellHook();

      this.hooksInstalled = true;
      this.logger.info('TerminalHookManager', 'Terminal hooks registered successfully');
      return true;
    } catch (error) {
      this.logger.error('TerminalHookManager', `Error registering terminal hooks: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Unregister terminal hooks
   */
  public async unregisterHooks(): Promise<boolean> {
    try {
      this.logger.info('TerminalHookManager', 'Unregistering terminal hooks');

      // Uninstall hooks
      await this.uninstallCurrentShellHook();

      this.hooksInstalled = false;
      this.logger.info('TerminalHookManager', 'Terminal hooks unregistered successfully');
      return true;
    } catch (error) {
      this.logger.error('TerminalHookManager', `Error unregistering terminal hooks: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Generate PowerShell hook script
   */
  private generatePowerShellHook(): void {
    const hookScript = `
# Transformers.js Docker Integration - Terminal Hook
# This script is automatically generated - DO NOT EDIT

# Check if Docker Integration is already running
if (-not (Get-Process -Name "Docker" -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is not running. Starting Docker..." -ForegroundColor Yellow

    # Try to start Docker
    try {
        if (Test-Path "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe") {
            Start-Process "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"
            Write-Host "Docker is starting, please wait..." -ForegroundColor Yellow

            # Wait for Docker to start
            $retries = 0
            while ($retries -lt 10) {
                try {
                    $null = docker info
                    Write-Host "Docker is now running." -ForegroundColor Green
                    break
                } catch {
                    $retries++
                    Start-Sleep -Seconds 2
                }
            }

            if ($retries -eq 10) {
                Write-Host "Timed out waiting for Docker to start." -ForegroundColor Red
                return
            }
        } else {
            Write-Host "Docker Desktop not found. Please start Docker manually." -ForegroundColor Red
            return
        }
    } catch {
        Write-Host "Error starting Docker: $_" -ForegroundColor Red
        return
    }
}

# Initialize Docker integration
try {
    $nodePath = node -e "console.log(process.execPath)"

    if ($nodePath) {
        $scriptPath = Join-Path "${this.hookScriptPath}" "init-integration.js"

        if (Test-Path $scriptPath) {
            & $nodePath $scriptPath
        } else {
            Write-Host "Docker integration script not found." -ForegroundColor Red
        }
    } else {
        Write-Host "Node.js not found. Docker integration not initialized." -ForegroundColor Red
    }
} catch {
    Write-Host "Error initializing Docker integration: $_" -ForegroundColor Red
}
`;

    // Write hook script to file
    fs.writeFileSync(path.join(this.hookScriptPath, 'powershell-hook.ps1'), hookScript);
    this.logger.debug('TerminalHookManager', 'Generated PowerShell hook script');
  }

  /**
   * Generate Bash hook script
   */
  private generateBashHook(): void {
    const hookScript = `#!/bin/bash

# Transformers.js Docker Integration - Terminal Hook
# This script is automatically generated - DO NOT EDIT

# Check if Docker Integration is already running
if ! pgrep -x "dockerd" > /dev/null; then
    echo "Docker is not running. Starting Docker..."

    # Try to start Docker
    if command -v docker > /dev/null; then
        # Platform-specific Docker start commands
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            open -a Docker
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            systemctl start docker || sudo systemctl start docker
        fi

        echo "Docker is starting, please wait..."

        # Wait for Docker to start
        retries=0
        while [ $retries -lt 10 ]; do
            if docker info &> /dev/null; then
                echo "Docker is now running."
                break
            else
                retries=$((retries+1))
                sleep 2
            fi
        done

        if [ $retries -eq 10 ]; then
            echo "Timed out waiting for Docker to start."
            return 1
        fi
    else
        echo "Docker not found. Please install Docker."
        return 1
    fi
fi

# Initialize Docker integration
node_path=$(which node 2>/dev/null)

if [ -n "$node_path" ]; then
    script_path="${this.hookScriptPath}/init-integration.js"

    if [ -f "$script_path" ]; then
        "$node_path" "$script_path"
    else
        echo "Docker integration script not found."
    fi
else
    echo "Node.js not found. Docker integration not initialized."
fi
`;

    // Write hook script to file
    fs.writeFileSync(path.join(this.hookScriptPath, 'bash-hook.sh'), hookScript);
    // Make script executable
    fs.chmodSync(path.join(this.hookScriptPath, 'bash-hook.sh'), '755');
    this.logger.debug('TerminalHookManager', 'Generated Bash hook script');
  }

  /**
   * Generate Node.js initialization script
   */
  public generateInitScript(): void {
    const initScript = `
// Transformers.js Docker Integration - Initialization Script
// This script is automatically generated - DO NOT EDIT

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Get the path to the Docker integration CLI
const integrationPath = path.join(os.homedir(), '.transformers-docker', 'bin', 'docker-trace');

// Check if the integration CLI exists
if (fs.existsSync(integrationPath)) {
  // Run the CLI with the init command
  const child = spawn('node', [integrationPath, 'init'], {
    detached: true,
    stdio: 'ignore'
  });

  // Detach the process
  child.unref();

  console.log('Docker integration initialized in the background.');
} else {
  console.error('Docker integration CLI not found. Please reinstall the Docker integration.');
}
`;

    // Write initialization script to file
    fs.writeFileSync(path.join(this.hookScriptPath, 'init-integration.js'), initScript);
    this.logger.debug('TerminalHookManager', 'Generated initialization script');
  }

  /**
   * Install hook for current shell
   */
  private async installCurrentShellHook(): Promise<void> {
    // Generate initialization script
    this.generateInitScript();

    // Detect current shell and install appropriate hook
    const shellType = this.detectShellType();

    this.logger.info('TerminalHookManager', `Installing hook for ${shellType}`);

    switch (shellType) {
      case 'powershell':
        await this.installPowerShellHook();
        break;
      case 'bash':
        await this.installBashHook();
        break;
      case 'zsh':
        await this.installZshHook();
        break;
      case 'cmd':
        await this.installCmdHook();
        break;
      default:
        this.logger.warn('TerminalHookManager', `Unsupported shell: ${shellType}`);
        break;
    }
  }

  /**
   * Uninstall hook for current shell
   */
  private async uninstallCurrentShellHook(): Promise<void> {
    // Detect current shell and uninstall appropriate hook
    const shellType = this.detectShellType();

    this.logger.info('TerminalHookManager', `Uninstalling hook for ${shellType}`);

    switch (shellType) {
      case 'powershell':
        await this.uninstallPowerShellHook();
        break;
      case 'bash':
        await this.uninstallBashHook();
        break;
      case 'zsh':
        await this.uninstallZshHook();
        break;
      case 'cmd':
        await this.uninstallCmdHook();
        break;
      default:
        this.logger.warn('TerminalHookManager', `Unsupported shell: ${shellType}`);
        break;
    }
  }

  /**
   * Install PowerShell hook
   */
  private async installPowerShellHook(): Promise<void> {
    const profilePath = await this.getPowerShellProfilePath();
    const hookLine = `\n\n# Transformers.js Docker Integration\nif (Test-Path "${this.hookScriptPath.replace(/\\/g, '\\\\')}\\powershell-hook.ps1") { . "${this.hookScriptPath.replace(/\\/g, '\\\\')}\\powershell-hook.ps1" }`;

    // Create profile if it doesn't exist
    if (!fs.existsSync(profilePath)) {
      fs.writeFileSync(profilePath, '# PowerShell Profile');
    }

    // Check if hook is already installed
    const profileContent = fs.readFileSync(profilePath, 'utf8');
    if (!profileContent.includes('Transformers.js Docker Integration')) {
      // Append hook to profile
      fs.appendFileSync(profilePath, hookLine);
      this.logger.info('TerminalHookManager', `Installed PowerShell hook at ${profilePath}`);
    } else {
      this.logger.info('TerminalHookManager', 'PowerShell hook is already installed');
    }
  }

  /**
   * Uninstall PowerShell hook
   */
  private async uninstallPowerShellHook(): Promise<void> {
    const profilePath = await this.getPowerShellProfilePath();

    if (fs.existsSync(profilePath)) {
      let profileContent = fs.readFileSync(profilePath, 'utf8');

      // Remove hook lines
      profileContent = profileContent.replace(/\n\n# Transformers\.js Docker Integration\nif \(Test-Path "[^"]+\\powershell-hook\.ps1"\) \{ \. "[^"]+\\powershell-hook\.ps1" \}/g, '');

      // Write updated profile
      fs.writeFileSync(profilePath, profileContent);
      this.logger.info('TerminalHookManager', 'Uninstalled PowerShell hook');
    }
  }

  /**
   * Install Bash hook
   */
  private async installBashHook(): Promise<void> {
    const profilePath = path.join(os.homedir(), '.bashrc');
    const hookLine = `\n\n# Transformers.js Docker Integration\nif [ -f "${this.hookScriptPath}/bash-hook.sh" ]; then\n  source "${this.hookScriptPath}/bash-hook.sh"\nfi`;

    // Create profile if it doesn't exist
    if (!fs.existsSync(profilePath)) {
      fs.writeFileSync(profilePath, '# Bash Profile');
    }

    // Check if hook is already installed
    const profileContent = fs.readFileSync(profilePath, 'utf8');
    if (!profileContent.includes('Transformers.js Docker Integration')) {
      // Append hook to profile
      fs.appendFileSync(profilePath, hookLine);
      this.logger.info('TerminalHookManager', `Installed Bash hook at ${profilePath}`);
    } else {
      this.logger.info('TerminalHookManager', 'Bash hook is already installed');
    }
  }

  /**
   * Uninstall Bash hook
   */
  private async uninstallBashHook(): Promise<void> {
    const profilePath = path.join(os.homedir(), '.bashrc');

    if (fs.existsSync(profilePath)) {
      let profileContent = fs.readFileSync(profilePath, 'utf8');

      // Remove hook lines
      profileContent = profileContent.replace(/\n\n# Transformers\.js Docker Integration\nif \[ -f "[^"]+\/bash-hook\.sh" \]; then\n  source "[^"]+\/bash-hook\.sh"\nfi/g, '');

      // Write updated profile
      fs.writeFileSync(profilePath, profileContent);
      this.logger.info('TerminalHookManager', 'Uninstalled Bash hook');
    }
  }

  /**
   * Install Zsh hook
   */
  private async installZshHook(): Promise<void> {
    const profilePath = path.join(os.homedir(), '.zshrc');
    const hookLine = `\n\n# Transformers.js Docker Integration\nif [ -f "${this.hookScriptPath}/bash-hook.sh" ]; then\n  source "${this.hookScriptPath}/bash-hook.sh"\nfi`;

    // Create profile if it doesn't exist
    if (!fs.existsSync(profilePath)) {
      fs.writeFileSync(profilePath, '# Zsh Profile');
    }

    // Check if hook is already installed
    const profileContent = fs.readFileSync(profilePath, 'utf8');
    if (!profileContent.includes('Transformers.js Docker Integration')) {
      // Append hook to profile
      fs.appendFileSync(profilePath, hookLine);
      this.logger.info('TerminalHookManager', `Installed Zsh hook at ${profilePath}`);
    } else {
      this.logger.info('TerminalHookManager', 'Zsh hook is already installed');
    }
  }

  /**
   * Uninstall Zsh hook
   */
  private async uninstallZshHook(): Promise<void> {
    const profilePath = path.join(os.homedir(), '.zshrc');

    if (fs.existsSync(profilePath)) {
      let profileContent = fs.readFileSync(profilePath, 'utf8');

      // Remove hook lines
      profileContent = profileContent.replace(/\n\n# Transformers\.js Docker Integration\nif \[ -f "[^"]+\/bash-hook\.sh" \]; then\n  source "[^"]+\/bash-hook\.sh"\nfi/g, '');

      // Write updated profile
      fs.writeFileSync(profilePath, profileContent);
      this.logger.info('TerminalHookManager', 'Uninstalled Zsh hook');
    }
  }

  /**
   * Install CMD hook
   */
  private async installCmdHook(): Promise<void> {
    try {
      // CMD hooks are set via registry
      const regPath = 'HKCU\\Software\\Microsoft\\Command Processor';
      const autoRunKey = 'AutoRun';

      // Generate a CMD script
      const cmdScriptPath = path.join(this.hookScriptPath, 'cmd-hook.cmd');
      const cmdScriptContent = `
@echo off
:: Transformers.js Docker Integration - Terminal Hook
:: This script is automatically generated - DO NOT EDIT

:: Check if Docker is running
tasklist /FI "IMAGENAME eq dockerd.exe" | find "dockerd.exe" >nul
if errorlevel 1 (
  echo Docker is not running. Starting Docker...

  :: Try to start Docker
  if exist "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe" (
    start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"
    echo Docker is starting, please wait...

    :: Wait for Docker to start
    set retries=0
    :retry
    if %retries% geq 10 (
      echo Timed out waiting for Docker to start.
      goto :end
    )

    docker info >nul 2>&1
    if errorlevel 1 (
      set /a retries+=1
      timeout /t 2 >nul
      goto :retry
    ) else (
      echo Docker is now running.
    )
  ) else (
    echo Docker Desktop not found. Please start Docker manually.
    goto :end
  )
)

:: Initialize Docker integration
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Docker integration not initialized.
  goto :end
)

if exist "${this.hookScriptPath.replace(/\\/g, '\\\\')}/init-integration.js" (
  node "${this.hookScriptPath.replace(/\\/g, '\\\\')}/init-integration.js"
) else (
  echo Docker integration script not found.
)

:end
`;

      // Write CMD script
      fs.writeFileSync(cmdScriptPath, cmdScriptContent);

      // Add registry key to run this script on CMD startup
      // Note: This requires registry access which may require admin privileges
      const regQuery = execSync(`reg query "${regPath}" /v "${autoRunKey}"`, { encoding: 'utf8' });

      if (regQuery.includes('ERROR')) {
        // Key doesn't exist, create it
        execSync(`reg add "${regPath}" /v "${autoRunKey}" /t REG_SZ /d "call \\"${cmdScriptPath}\\"" /f`);
      } else {
        // Key exists, check if our hook is already installed
        if (!regQuery.includes(cmdScriptPath.replace(/\\/g, '\\\\'))) {
          // Extract current value
          const currentValue = regQuery.split('REG_SZ')[1].trim();

          // Add our hook
          execSync(`reg add "${regPath}" /v "${autoRunKey}" /t REG_SZ /d "${currentValue} & call \\"${cmdScriptPath}\\"" /f`);
        }
      }

      this.logger.info('TerminalHookManager', 'Installed CMD hook');
    } catch (error) {
      this.logger.error('TerminalHookManager', `Error installing CMD hook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uninstall CMD hook
   */
  private async uninstallCmdHook(): Promise<void> {
    try {
      const regPath = 'HKCU\\Software\\Microsoft\\Command Processor';
      const autoRunKey = 'AutoRun';
      const cmdScriptPath = path.join(this.hookScriptPath, 'cmd-hook.cmd');

      // Check if the registry key exists
      const regQuery = execSync(`reg query "${regPath}" /v "${autoRunKey}"`, { encoding: 'utf8' });

      if (!regQuery.includes('ERROR')) {
        // Extract current value
        let currentValue = regQuery.split('REG_SZ')[1].trim();

        // Remove our hook
        currentValue = currentValue.replace(new RegExp(`& call \\"${cmdScriptPath.replace(/\\/g, '\\\\')}\\"`, 'g'), '');
        currentValue = currentValue.replace(new RegExp(`call \\"${cmdScriptPath.replace(/\\/g, '\\\\')}\\"`, 'g'), '');

        // Clean up extra '&'
        currentValue = currentValue.replace(/&\s*&/g, '&').trim();
        if (currentValue.startsWith('&')) {
          currentValue = currentValue.substring(1).trim();
        }
        if (currentValue.endsWith('&')) {
          currentValue = currentValue.substring(0, currentValue.length - 1).trim();
        }

        // Update or delete the registry key
        if (currentValue) {
          execSync(`reg add "${regPath}" /v "${autoRunKey}" /t REG_SZ /d "${currentValue}" /f`);
        } else {
          execSync(`reg delete "${regPath}" /v "${autoRunKey}" /f`);
        }
      }

      // Delete the CMD script
      if (fs.existsSync(cmdScriptPath)) {
        fs.unlinkSync(cmdScriptPath);
      }

      this.logger.info('TerminalHookManager', 'Uninstalled CMD hook');
    } catch (error) {
      this.logger.error('TerminalHookManager', `Error uninstalling CMD hook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Detect the current shell type
   */
  private detectShellType(): string {
    if (process.env.SHELL) {
      if (process.env.SHELL.includes('bash')) {
        return 'bash';
      } else if (process.env.SHELL.includes('zsh')) {
        return 'zsh';
      }
    }

    if (process.platform === 'win32') {
      // Check if running in PowerShell
      if (process.env.PSModulePath) {
        return 'powershell';
      }

      // Default to CMD on Windows
      return 'cmd';
    }

    // Default to Bash
    return 'bash';
  }

  /**
   * Get PowerShell profile path
   */
  private async getPowerShellProfilePath(): Promise<string> {
    try {
      // Try to get profile path from PowerShell
      const psCommand = 'powershell.exe -Command "echo $PROFILE"';
      const profilePath = execSync(psCommand, { encoding: 'utf8' }).trim();

      // Create directory if it doesn't exist
      const profileDir = path.dirname(profilePath);
      if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
      }

      return profilePath;
    } catch (error) {
      // Fallback to default path
      this.logger.warn('TerminalHookManager', `Error getting PowerShell profile path: ${error instanceof Error ? error.message : String(error)}`);

      const documentsPath = path.join(os.homedir(), 'Documents');
      return path.join(documentsPath, 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1');
    }
  }

  /**
   * Get hook status
   */
  public getHookStatus(): any {
    return {
      installed: this.hooksInstalled,
      hookScriptPath: this.hookScriptPath,
      shellType: this.detectShellType(),
      hookFiles: fs.readdirSync(this.hookScriptPath)
    };
  }
}
