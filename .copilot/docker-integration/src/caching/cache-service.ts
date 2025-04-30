/**
 * Cache Service - Handles model and layer caching for transformers.js Docker integration
 */
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { CacheManager } from './cache-manager';
import { Logger } from '../utils/logger';

// Initialize logger
const logger = new Logger('cache-service');

// Configure cache directory and settings
const CACHE_DIR = process.env.CACHE_DIR || '/cache';
const CACHE_SIZE = process.env.CACHE_SIZE || '10GB';
const CACHE_TTL = process.env.CACHE_TTL || '30d';
const PRUNE_INTERVAL = process.env.PRUNE_INTERVAL || '24h';
const PORT = parseInt(process.env.CACHE_HEALTH_PORT || '8081', 10);

// Parse cache size to bytes
function parseSize(size: string): number {
	const units: Record<string, number> = {
		'B': 1,
		'KB': 1024,
		'MB': 1024 * 1024,
		'GB': 1024 * 1024 * 1024,
		'TB': 1024 * 1024 * 1024 * 1024
	};

	const match = size.match(/^(\d+(?:\.\d+)?)([KMGT]?B)$/i);
	if (match) {
		const value = parseFloat(match[1]);
		const unit = match[2].toUpperCase();
		return value * (units[unit] || 1);
	}
	return parseInt(size, 10);
}

// Parse time interval to milliseconds
function parseTimeInterval(interval: string): number {
	const units: Record<string, number> = {
		's': 1000,
		'm': 60 * 1000,
		'h': 60 * 60 * 1000,
		'd': 24 * 60 * 60 * 1000
	};

	const match = interval.match(/^(\d+)([smhd])$/i);
	if (match) {
		const value = parseInt(match[1], 10);
		const unit = match[2].toLowerCase();
		return value * (units[unit] || 1000);
	}
	return parseInt(interval, 10);
}

// Initialize cache manager
logger.info('Initializing cache manager');
const cacheManager = new CacheManager({
	cacheDir: CACHE_DIR,
	maxSize: parseSize(CACHE_SIZE),
	ttl: parseTimeInterval(CACHE_TTL),
	pruneInterval: parseTimeInterval(PRUNE_INTERVAL)
});

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
	logger.info(`Creating cache directory: ${CACHE_DIR}`);
	fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Create health status file
const HEALTH_FILE_DIR = process.env.HEALTH_FILE_DIR || '/tmp';
if (!fs.existsSync(HEALTH_FILE_DIR)) {
	fs.mkdirSync(HEALTH_FILE_DIR, { recursive: true });
}

function updateHealthFile(status: 'healthy' | 'unhealthy', message?: string) {
	try {
		const healthData = {
			status,
			timestamp: new Date().toISOString(),
			message: message || ''
		};

		fs.writeFileSync(
			path.join(HEALTH_FILE_DIR, 'cache-health.json'),
			JSON.stringify(healthData, null, 2)
		);
	} catch (error) {
		logger.error(`Failed to write health file: ${(error as Error).message}`);
	}
}

// Start HTTP server for health checks
const server = http.createServer((req, res) => {
	if (req.url === '/health') {
		res.setHeader('Content-Type', 'application/json');

		// Check cache status
		const cacheStatus = cacheManager.getStatus();

		if (cacheStatus.isAvailable) {
			res.statusCode = 200;
			res.end(JSON.stringify({ status: 'ok', details: cacheStatus }));
		} else {
			res.statusCode = 500;
			res.end(JSON.stringify({ status: 'error', message: 'Cache is unavailable', details: cacheStatus }));
		}
	} else {
		res.statusCode = 404;
		res.end(JSON.stringify({ status: 'error', message: 'Not found' }));
	}
});

server.listen(PORT, () => {
	logger.info(`Cache service running on port ${PORT}`);
	updateHealthFile('healthy', 'Cache service started successfully');
});

// Handle process termination
process.on('SIGTERM', () => {
	logger.info('Received SIGTERM, shutting down...');
	server.close(() => {
		logger.info('Server closed');
		updateHealthFile('unhealthy', 'Service is shutting down');
		process.exit(0);
	});
});

// Perform initial cache pruning
logger.info('Performing initial cache pruning');
cacheManager.pruneCache()
	.then((pruneResult) => {
		logger.info(`Initial pruning complete: ${pruneResult.freedBytes} bytes freed, ${pruneResult.removedEntries} entries removed`);
	})
	.catch((error) => {
		logger.error(`Error during initial pruning: ${error.message}`);
	});

// Export cache manager for external use
export { cacheManager };
