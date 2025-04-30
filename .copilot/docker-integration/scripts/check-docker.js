/**
 * Pre-installation script to check if Docker is installed
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

console.log(`${colors.cyan}=== Transformers.js Docker Integration - Pre-installation Check ===${colors.reset}`);
console.log(`${colors.cyan}Checking if Docker is installed and running...${colors.reset}`);

try {
	// Try to execute docker version command
	const dockerVersionOutput = execSync('docker version', { encoding: 'utf8' });
	console.log(`${colors.green}Docker is installed.${colors.reset}`);

	// Extract Docker version information
	const serverVersionMatch = dockerVersionOutput.match(/Server Version:\s+(\d+\.\d+\.\d+)/);
	const clientVersionMatch = dockerVersionOutput.match(/Client Version:\s+(\d+\.\d+\.\d+)/);

	const serverVersion = serverVersionMatch ? serverVersionMatch[1] : 'unknown';
	const clientVersion = clientVersionMatch ? clientVersionMatch[1] : 'unknown';

	console.log(`${colors.blue}Docker Client Version: ${clientVersion}${colors.reset}`);
	console.log(`${colors.blue}Docker Server Version: ${serverVersion}${colors.reset}`);

	// Check if Docker is running
	try {
		execSync('docker info', { encoding: 'utf8' });
		console.log(`${colors.green}Docker daemon is running.${colors.reset}`);
	} catch (error) {
		console.log(`${colors.yellow}Docker is installed but not running. Starting Docker...${colors.reset}`);

		// Try to start Docker based on platform
		if (process.platform === 'win32') {
			try {
				if (fs.existsSync('C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe')) {
					console.log(`${colors.yellow}Starting Docker Desktop...${colors.reset}`);
					const startProcess = require('child_process').spawn('C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe', [], {
						detached: true,
						stdio: 'ignore'
					});
					startProcess.unref();
					console.log(`${colors.yellow}Docker Desktop is starting. Please wait a few moments for it to initialize.${colors.reset}`);
				} else {
					console.log(`${colors.red}Docker Desktop executable not found. Please start Docker manually.${colors.reset}`);
					process.exit(1);
				}
			} catch (startError) {
				console.log(`${colors.red}Error starting Docker Desktop: ${startError.message}${colors.reset}`);
				console.log(`${colors.yellow}Please start Docker Desktop manually.${colors.reset}`);
				process.exit(1);
			}
		} else if (process.platform === 'darwin') {
			try {
				console.log(`${colors.yellow}Starting Docker Desktop for Mac...${colors.reset}`);
				execSync('open -a Docker', { encoding: 'utf8' });
				console.log(`${colors.yellow}Docker Desktop is starting. Please wait a few moments for it to initialize.${colors.reset}`);
			} catch (startError) {
				console.log(`${colors.red}Error starting Docker Desktop: ${startError.message}${colors.reset}`);
				console.log(`${colors.yellow}Please start Docker Desktop manually.${colors.reset}`);
				process.exit(1);
			}
		} else {
			// For Linux
			console.log(`${colors.yellow}Please start the Docker daemon with: sudo systemctl start docker${colors.reset}`);
			process.exit(1);
		}
	}

	// Check for Docker Compose
	try {
		const composeVersionOutput = execSync('docker compose version', { encoding: 'utf8' });
		console.log(`${colors.green}Docker Compose is installed.${colors.reset}`);

		// Extract Docker Compose version
		const composeVersionMatch = composeVersionOutput.match(/Docker Compose version v?(\d+\.\d+\.\d+)/);
		const composeVersion = composeVersionMatch ? composeVersionMatch[1] : 'unknown';
		console.log(`${colors.blue}Docker Compose Version: ${composeVersion}${colors.reset}`);
	} catch (error) {
		console.log(`${colors.yellow}Docker Compose is not available as a plugin. Checking for standalone installation...${colors.reset}`);

		try {
			const composeVersionOutput = execSync('docker-compose version', { encoding: 'utf8' });
			console.log(`${colors.green}Docker Compose (standalone) is installed.${colors.reset}`);

			// Extract Docker Compose version
			const composeVersionMatch = composeVersionOutput.match(/docker-compose version (\d+\.\d+\.\d+)/);
			const composeVersion = composeVersionMatch ? composeVersionMatch[1] : 'unknown';
			console.log(`${colors.blue}Docker Compose Version: ${composeVersion}${colors.reset}`);
		} catch (composeError) {
			console.log(`${colors.yellow}Docker Compose not found. Some features may not work correctly.${colors.reset}`);
			console.log(`${colors.yellow}Please install Docker Compose: https://docs.docker.com/compose/install/${colors.reset}`);
		}
	}

	// Check for GPU support
	console.log(`${colors.cyan}Checking for GPU support...${colors.reset}`);

	try {
		if (process.platform === 'win32') {
			try {
				// Check for NVIDIA GPU on Windows
				execSync('nvidia-smi', { encoding: 'utf8' });
				console.log(`${colors.green}NVIDIA GPU detected.${colors.reset}`);

				// Check if Docker supports NVIDIA runtime
				try {
					const dockerInfoOutput = execSync('docker info', { encoding: 'utf8' });
					if (dockerInfoOutput.includes('nvidia')) {
						console.log(`${colors.green}Docker NVIDIA runtime is available.${colors.reset}`);
					} else {
						console.log(`${colors.yellow}Docker NVIDIA runtime not detected. GPU acceleration may not work.${colors.reset}`);
					}
				} catch (nvidiaRuntimeError) {
					console.log(`${colors.yellow}Could not check for NVIDIA Docker runtime: ${nvidiaRuntimeError.message}${colors.reset}`);
				}
			} catch (nvidiaSmiError) {
				console.log(`${colors.yellow}No NVIDIA GPU detected or drivers not installed.${colors.reset}`);
			}
		} else if (process.platform === 'darwin') {
			// For macOS, check Apple Silicon
			try {
				const cpuType = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' });
				if (cpuType.includes('Apple')) {
					console.log(`${colors.green}Apple Silicon detected. Native acceleration available.${colors.reset}`);
				} else {
					console.log(`${colors.yellow}Intel Mac detected. GPU acceleration may be limited.${colors.reset}`);
				}
			} catch (appleError) {
				console.log(`${colors.yellow}Could not determine Mac processor type: ${appleError.message}${colors.reset}`);
			}
		} else {
			// For Linux
			try {
				execSync('nvidia-smi', { encoding: 'utf8' });
				console.log(`${colors.green}NVIDIA GPU detected.${colors.reset}`);

				// Check for NVIDIA Docker runtime
				try {
					const dockerInfoOutput = execSync('docker info', { encoding: 'utf8' });
					if (dockerInfoOutput.includes('nvidia')) {
						console.log(`${colors.green}Docker NVIDIA runtime is available.${colors.reset}`);
					} else {
						console.log(`${colors.yellow}Docker NVIDIA runtime not detected. GPU acceleration may not work.${colors.reset}`);
						console.log(`${colors.yellow}Consider installing nvidia-container-toolkit: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html${colors.reset}`);
					}
				} catch (nvidiaRuntimeError) {
					console.log(`${colors.yellow}Could not check for NVIDIA Docker runtime: ${nvidiaRuntimeError.message}${colors.reset}`);
				}
			} catch (nvidiaSmiError) {
				console.log(`${colors.yellow}No NVIDIA GPU detected or drivers not installed.${colors.reset}`);
			}
		}
	} catch (gpuError) {
		console.log(`${colors.yellow}Could not check GPU status: ${gpuError.message}${colors.reset}`);
	}

	console.log(`${colors.green}Docker pre-installation check completed successfully.${colors.reset}`);
} catch (error) {
	console.log(`${colors.red}Docker is not installed or not in PATH.${colors.reset}`);
	console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
	console.log(`${colors.yellow}Please install Docker: https://docs.docker.com/get-docker/${colors.reset}`);

	// Create marker file to indicate Docker is not installed
	const markerDir = path.join(os.homedir(), '.transformers-docker');
	if (!fs.existsSync(markerDir)) {
		fs.mkdirSync(markerDir, { recursive: true });
	}

	fs.writeFileSync(path.join(markerDir, 'docker-not-installed.json'), JSON.stringify({
		timestamp: new Date().toISOString(),
		error: error.message
	}, null, 2));

	process.exit(1);
}
