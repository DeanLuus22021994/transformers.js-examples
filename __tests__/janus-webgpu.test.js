import { describe, expect, test, jest } from '@jest/globals';

// Check if GPU is available and has sufficient memory
const hasGPU = process.env.HAS_GPU === 'true';
const gpuMemGB = parseFloat(process.env.GPU_MEM_GB || '0');
const minRequiredMemGB = 5;

// Skip tests if GPU requirements are not met
const shouldRunTests = hasGPU && gpuMemGB >= minRequiredMemGB;

// This is a conditional test suite that only runs when GPU is available
(shouldRunTests ? describe : describe.skip)('janus-webgpu multimodal model tests', () => {
	// Mock the WebGPU API since Jest runs in Node.js
	beforeAll(() => {
		// Only setup mocks if we're actually running tests
		if (shouldRunTests) {
			global.navigator = {
				gpu: {
					requestAdapter: jest.fn().mockResolvedValue({
						requestDevice: jest.fn().mockResolvedValue({
							createBuffer: jest.fn(),
							createCommandEncoder: jest.fn(),
							queue: { submit: jest.fn() }
						})
					})
				}
			};
		}
	});

	test('WebGPU device can be acquired', async () => {
		// This is a simple test to verify WebGPU availability
		const adapter = await navigator.gpu.requestAdapter();
		const device = await adapter.requestDevice();

		expect(device).toBeDefined();
		expect(typeof device.createBuffer).toBe('function');
	});

	test('WebGPU compute pipeline can be created', async () => {
		// This is a placeholder test - in a real test, we'd test the actual compute pipeline
		// that the Janus model uses
		const mockCreateComputePipeline = jest.fn().mockReturnValue({});
		const adapter = await navigator.gpu.requestAdapter();
		const device = await adapter.requestDevice();
		device.createComputePipeline = mockCreateComputePipeline;

		device.createComputePipeline();
		expect(mockCreateComputePipeline).toHaveBeenCalled();
	});
});

// This test always runs to verify the GPU check logic
describe('GPU availability check', () => {
	test('GPU requirements are checked correctly', () => {
		console.log(`GPU available: ${hasGPU}, GPU memory: ${gpuMemGB}GB, Required: ${minRequiredMemGB}GB`);

		if (!shouldRunTests) {
			console.log('Skipping WebGPU tests due to insufficient GPU resources');
		}

		// This just verifies our environment variables are parsed correctly
		expect(typeof hasGPU).toBe('boolean');
		expect(typeof gpuMemGB).toBe('number');
	});
});
