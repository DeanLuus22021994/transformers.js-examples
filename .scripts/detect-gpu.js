#!/usr/bin/env node

// Script to detect GPU availability and memory
// Used by the test:gpu npm script to set environment variables

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const MIN_GPU_MEMORY_GB = 5;

function detectNvidiaGPU() {
	try {
		// Try to run nvidia-smi to get GPU information
		const nvsmiOutput = execSync('nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits').toString();

		// Parse the output to get GPU memory in MB
		const gpuMemMB = parseInt(nvsmiOutput.trim(), 10);

		if (isNaN(gpuMemMB)) {
			console.log('❌ Failed to parse GPU memory information');
			return { hasGPU: false, memoryGB: 0 };
		}

		// Convert to GB
		const gpuMemGB = gpuMemMB / 1024;
		console.log(`✅ NVIDIA GPU detected with ${gpuMemGB.toFixed(1)}GB memory`);

		return { hasGPU: true, memoryGB: gpuMemGB };
	} catch (error) {
		console.log('❌ No NVIDIA GPU detected or nvidia-smi not available');
		return { hasGPU: false, memoryGB: 0 };
	}
}

// Detect GPU and set environment variables
const { hasGPU, memoryGB } = detectNvidiaGPU();

// Write environment variables to .env.test file for Jest to use
const envContent = `
HAS_GPU=${hasGPU}
GPU_MEM_GB=${memoryGB.toFixed(1)}
`;

fs.writeFileSync(path.join(process.cwd(), '.env.test'), envContent);

// Print information about WebGPU project compatibility
console.log('\nWebGPU Project Compatibility:');
if (!hasGPU) {
	console.log('❌ No compatible GPU detected - WebGPU tests will be skipped');
} else if (memoryGB < MIN_GPU_MEMORY_GB) {
	console.log(`⚠️  GPU memory (${memoryGB.toFixed(1)}GB) is below recommended minimum (${MIN_GPU_MEMORY_GB}GB) - some WebGPU tests may fail`);
} else {
	console.log(`✅ GPU memory (${memoryGB.toFixed(1)}GB) is sufficient for WebGPU tests`);
}

// Also create an output for Jest to parse in beforeAll hooks
const jestGpuInfo = {
	hasGPU,
	memoryGB,
	minRequiredMemGB: MIN_GPU_MEMORY_GB,
	date: new Date().toISOString()
};

fs.writeFileSync(path.join(process.cwd(), 'gpu-info.json'), JSON.stringify(jestGpuInfo, null, 2));
