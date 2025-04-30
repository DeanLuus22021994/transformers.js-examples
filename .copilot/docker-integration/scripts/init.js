#!/usr/bin/env node

/**
 * First-time initialization script for transformers.js Docker integration
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m'
};

// Create readline interface for user input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Promisify readline question
function question(query) {
	return new Promise(resolve => {
		rl.question(query, answer => {
			resolve(answer);
		});
	});
}

// Print colored messages
function printColor(message, color) {
	console.log(`${color}${message}${colors.reset}`);
}

// Detect operating system
const platform = os.platform();
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

// Paths
const homeDir = os.homedir();
const rootDir = path.resolve(__dirname, '..', '..');
const configDir = path.join(rootDir, 'config');
const cacheDir = path.join(homeDir, '.transformersjs-cache');

// Create cache directory if it doesn't exist
if (!fs.existsSync(cacheDir)) {
	printColor(`Creating cache directory: ${cacheDir}`, colors.blue);
	fs.mkdirSync(cacheDir, { recursive: true });
}

// Create config directory if it doesn't exist
if (!fs.existsSync(configDir)) {
	printColor(`Creating config directory: ${configDir}`, colors.blue);
	fs.mkdirSync(configDir, { recursive: true });
}

/**
 * Check Docker installation and version
 */
async function checkDockerInstallation() {
	printColor('Checking Docker installation...', colors.blue);

	try {
		const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
		printColor(`Docker installed: ${dockerVersion}`, colors.green);

		// Check Docker Compose
		try {
			const composeVersion = execSync('docker compose version', { encoding: 'utf8' }).trim();
			printColor(`Docker Compose installed: ${composeVersion}`, colors.green);
		} catch (composeError) {
			try {
				const legacyComposeVersion = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
				printColor(`Docker Compose (legacy) installed: ${legacyComposeVersion}`, colors.green);
			} catch (legacyComposeError) {
				printColor('Docker Compose not found. Some features may not work correctly.', colors.yellow);

				const installCompose = await question('Would you like to install Docker Compose? (y/n): ');
				if (installCompose.toLowerCase() === 'y') {
					installDockerCompose();
				}
			}
		}

		return true;
	} catch (error) {
		printColor('Docker is not installed or not in PATH.', colors.red);
		printColor(`Error: ${error.message}`, colors.red);

		const installDocker = await question('Would you like to install Docker? (y/n): ');
		if (installDocker.toLowerCase() === 'y') {
			installDocker();
		} else {
			printColor('Docker is required for this integration. Please install Docker manually.', colors.yellow);
			return false;
		}
	}
}

/**
 * Install Docker
 */
function installDocker() {
	printColor('Installing Docker...', colors.blue);

	if (isWindows) {
		printColor('Please download and install Docker Desktop for Windows:', colors.yellow);
		printColor('https://www.docker.com/products/docker-desktop', colors.cyan);
		execSync('start https://www.docker.com/products/docker-desktop', { stdio: 'ignore' });
	} else if (isMac) {
		printColor('Please download and install Docker Desktop for Mac:', colors.yellow);
		printColor('https://www.docker.com/products/docker-desktop', colors.cyan);
		execSync('open https://www.docker.com/products/docker-desktop', { stdio: 'ignore' });
	} else if (isLinux) {
		printColor('Installing Docker on Linux...', colors.blue);
		try {
			execSync('curl -fsSL https://get.docker.com -o get-docker.sh', { stdio: 'inherit' });
			execSync('sh get-docker.sh', { stdio: 'inherit' });
			execSync('sudo usermod -aG docker $USER', { stdio: 'inherit' });
			printColor('Docker installed successfully. You may need to log out and back in for changes to take effect.', colors.green);
		} catch (error) {
			printColor(`Error installing Docker: ${error.message}`, colors.red);
			printColor('Please install Docker manually: https://docs.docker.com/engine/install/', colors.yellow);
		}
	}
}

/**
 * Install Docker Compose
 */
function installDockerCompose() {
	printColor('Installing Docker Compose...', colors.blue);

	if (isWindows) {
		printColor('Docker Compose is included with Docker Desktop for Windows.', colors.yellow);
		printColor('Please install Docker Desktop: https://www.docker.com/products/docker-desktop', colors.cyan);
	} else if (isMac) {
		printColor('Docker Compose is included with Docker Desktop for Mac.', colors.yellow);
		printColor('Please install Docker Desktop: https://www.docker.com/products/docker-desktop', colors.cyan);
	} else if (isLinux) {
		printColor('Installing Docker Compose on Linux...', colors.blue);
		try {
			execSync('sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose', { stdio: 'inherit' });
			execSync('sudo chmod +x /usr/local/bin/docker-compose', { stdio: 'inherit' });
			printColor('Docker Compose installed successfully.', colors.green);
		} catch (error) {
			printColor(`Error installing Docker Compose: ${error.message}`, colors.red);
			printColor('Please install Docker Compose manually: https://docs.docker.com/compose/install/', colors.yellow);
		}
	}
}

/**
 * Create default configuration
 */
function createDefaultConfiguration() {
	printColor('Creating default configuration...', colors.blue);

	const configPath = path.join(configDir, 'config.json');
	const defaultConfig = {
		version: '1.0.0',
		cacheDir: cacheDir,
		cacheSize: '10GB',
		cacheTtl: '30d',
		docker: {
			compose: {
				projectName: 'transformersjs',
				defaultProfile: 'dev'
			},
			swarm: {
				enabled: false,
				autoInit: false
			}
		},
		autoStart: true,
		logLevel: 'info',
		terminal: {
			hookEnabled: true
		},
		gpu: {
			enabled: detectGpu(),
			type: detectGpuType()
		}
	};

	fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
	printColor(`Configuration created at: ${configPath}`, colors.green);
}

/**
 * Detect GPU availability
 */
function detectGpu() {
	try {
		if (isWindows) {
			const nvsmiOutput = execSync('where nvidia-smi', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
			return nvsmiOutput.includes('nvidia-smi');
		} else if (isMac) {
			// Check for Apple Silicon
			const cpuType = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' });
			return cpuType.includes('Apple');
		} else if (isLinux) {
			try {
				execSync('nvidia-smi', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
				return true;
			} catch (error) {
				return false;
			}
		}
	} catch (error) {
		return false;
	}

	return false;
}

/**
 * Detect GPU type
 */
function detectGpuType() {
	try {
		if (isWindows || isLinux) {
			try {
				const nvsmiOutput = execSync('nvidia-smi --query-gpu=name --format=csv,noheader', { encoding: 'utf8' });
				if (nvsmiOutput) {
					return `nvidia:${nvsmiOutput.trim()}`;
				}
			} catch (error) {
				// No NVIDIA GPU
			}
		} else if (isMac) {
			const cpuType = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' });
			if (cpuType.includes('Apple')) {
				return 'apple-silicon';
			}
		}
	} catch (error) {
		// Ignore error
	}

	return 'none';
}

/**
 * Set up terminal hooks
 */
function setupTerminalHooks() {
	printColor('Setting up terminal hooks...', colors.blue);

	const vsCodeDir = path.join(rootDir, '.vscode');
	const settingsPath = path.join(vsCodeDir, 'settings.json');

	// Create .vscode directory if it doesn't exist
	if (!fs.existsSync(vsCodeDir)) {
		fs.mkdirSync(vsCodeDir, { recursive: true });
	}

	// Create or update settings.json
	let settings = {};
	if (fs.existsSync(settingsPath)) {
		try {
			settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
		} catch (error) {
			printColor(`Error reading settings.json: ${error.message}`, colors.yellow);
		}
	}

	// Set terminal.integrated.shellIntegration.enabled to true
	settings['terminal.integrated.shellIntegration.enabled'] = true;

	// Set terminal initialization scripts
	if (!settings['terminal.integrated.profiles.windows']) {
		settings['terminal.integrated.profiles.windows'] = {};
	}

	if (!settings['terminal.integrated.profiles.osx']) {
		settings['terminal.integrated.profiles.osx'] = {};
	}

	if (!settings['terminal.integrated.profiles.linux']) {
		settings['terminal.integrated.profiles.linux'] = {};
	}

	// Set default profiles for each platform
	settings['terminal.integrated.defaultProfile.windows'] = 'PowerShell';
	settings['terminal.integrated.defaultProfile.osx'] = 'bash';
	settings['terminal.integrated.defaultProfile.linux'] = 'bash';

	// Set initialization scripts
	const psScriptPath = path.relative(rootDir, path.join(rootDir, '.copilot', 'docker-integration', 'scripts', 'bootstrap.ps1'));
	const bashScriptPath = path.relative(rootDir, path.join(rootDir, '.copilot', 'docker-integration', 'scripts', 'bootstrap.sh'));

	settings['terminal.integrated.profiles.windows'].PowerShell = {
		source: 'PowerShell',
		icon: 'terminal-powershell',
		args: ['-NoExit', '-Command', `& {& '${psScriptPath.replace(/\\/g, '\\\\')}'}`]
	};

	settings['terminal.integrated.profiles.osx'].bash = {
		path: 'bash',
		icon: 'terminal-bash',
		args: ['--init-file', bashScriptPath]
	};

	settings['terminal.integrated.profiles.linux'].bash = {
		path: 'bash',
		icon: 'terminal-bash',
		args: ['--init-file', bashScriptPath]
	};

	// Write updated settings
	fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
	printColor(`VS Code settings updated: ${settingsPath}`, colors.green);
}

/**
 * Create CLI symlinks
 */
function createCliSymlinks() {
	printColor('Creating CLI symlinks...', colors.blue);

	const binDir = path.join(rootDir, '.copilot', 'docker-integration', 'bin');
	if (!fs.existsSync(binDir)) {
		fs.mkdirSync(binDir, { recursive: true });
	}

	const cliScript = path.join(rootDir, '.copilot', 'docker-integration', 'dist', 'cli.js');
	const symlinkName = isWindows ? 'tdocker.cmd' : 'tdocker';
	const symlinkPath = path.join(binDir, symlinkName);

	if (isWindows) {
		// Create a .cmd file for Windows
		const cmdContent = '@echo off\r\nnode "%~dp0..\\dist\\cli.js" %*';
		fs.writeFileSync(symlinkPath, cmdContent);
	} else {
		// Create a shell script for Linux/Mac
		const shContent = '#!/bin/sh\nnode "$(dirname "$0")/../dist/cli.js" "$@"';
		fs.writeFileSync(symlinkPath, shContent);
		fs.chmodSync(symlinkPath, '755');
	}

	printColor(`CLI symlink created: ${symlinkPath}`, colors.green);
}

/**
 * Main initialization function
 */
async function initialize() {
	printColor('=== Transformers.js Docker Integration - First-time Setup ===', colors.cyan);

	try {
		// Check Docker installation
		const dockerInstalled = await checkDockerInstallation();
		if (!dockerInstalled) {
			printColor('Docker is required for this integration. Exiting setup.', colors.red);
			return;
		}

		// Create default configuration
		createDefaultConfiguration();

		// Set up terminal hooks
		setupTerminalHooks();

		// Create CLI symlinks
		createCliSymlinks();

		printColor('=== Setup Complete ===', colors.green);
		printColor('You can now use the transformers.js Docker integration.', colors.green);
		printColor('To get started, open a new terminal in VS Code.', colors.green);

	} catch (error) {
		printColor(`Error during initialization: ${error.message}`, colors.red);
		console.error(error);
	} finally {
		rl.close();
	}
}

// Run initialization
initialize();
