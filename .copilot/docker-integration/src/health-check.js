/**
 * Health check script for Docker services
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Get service name from arguments
const serviceName = process.argv[2];

if (!serviceName) {
	console.error('Service name must be provided as an argument');
	process.exit(1);
}

// Configuration for each service's health check
const healthChecks = {
	core: {
		port: process.env.CORE_HEALTH_PORT || 8080,
		path: '/health',
		timeout: 5000,
	},
	cache: {
		port: process.env.CACHE_HEALTH_PORT || 8081,
		path: '/health',
		timeout: 5000,
	},
	copilot: {
		port: process.env.COPILOT_HEALTH_PORT || 8082,
		path: '/health',
		timeout: 5000,
	},
};

// Get health check config for the requested service
const config = healthChecks[serviceName];
if (!config) {
	console.error(`No health check configuration found for service: ${serviceName}`);
	process.exit(1);
}

// Check if a file-based health check should be used instead
const healthFilePath = path.join(process.env.HEALTH_FILE_DIR || '/tmp', `${serviceName}-health.json`);
if (fs.existsSync(healthFilePath)) {
	try {
		const fileContent = fs.readFileSync(healthFilePath, 'utf8');
		const healthData = JSON.parse(fileContent);

		// Check if health data is recent (within the last minute)
		const timestamp = new Date(healthData.timestamp).getTime();
		const now = Date.now();

		if (now - timestamp < 60000 && healthData.status === 'healthy') {
			console.log(`Service ${serviceName} is healthy (file-based check)`);
			process.exit(0);
		} else {
			console.error(`Service ${serviceName} is unhealthy (file-based check)`);
			process.exit(1);
		}
	} catch (error) {
		console.error(`Error reading health file: ${error.message}`);
		// Continue with HTTP health check if file-based check fails
	}
}

// Perform HTTP health check
const req = http.request({
	hostname: 'localhost',
	port: config.port,
	path: config.path,
	method: 'GET',
	timeout: config.timeout,
}, (res) => {
	let data = '';

	res.on('data', (chunk) => {
		data += chunk;
	});

	res.on('end', () => {
		try {
			// Try to parse response as JSON
			const healthData = JSON.parse(data);

			if (res.statusCode === 200 && healthData.status === 'ok') {
				console.log(`Service ${serviceName} is healthy`);
				process.exit(0);
			} else {
				console.error(`Service ${serviceName} health check failed: ${healthData.message || 'Unknown error'}`);
				process.exit(1);
			}
		} catch (error) {
			if (res.statusCode === 200) {
				console.log(`Service ${serviceName} returned 200 OK`);
				process.exit(0);
			} else {
				console.error(`Service ${serviceName} health check failed with status ${res.statusCode}`);
				process.exit(1);
			}
		}
	});
});

req.on('error', (error) => {
	console.error(`Health check error for service ${serviceName}: ${error.message}`);
	process.exit(1);
});

req.on('timeout', () => {
	console.error(`Health check timed out for service ${serviceName}`);
	req.destroy();
	process.exit(1);
});

req.end();
