// Setup file for Jest tests

// Mock browser objects for tests
global.document = {
	getElementById: jest.fn().mockImplementation(() => ({
		addEventListener: jest.fn(),
		appendChild: jest.fn(),
		innerHTML: '',
		style: {},
		src: '',
		textContent: ''
	})),
	createElement: jest.fn().mockImplementation(() => ({
		className: '',
		style: {},
		appendChild: jest.fn(),
		addEventListener: jest.fn(),
		src: '',
		textContent: ''
	}))
};

// Mock FileReader for browser tests
global.FileReader = class {
	constructor() {
		this.onload = jest.fn();
	}
	readAsDataURL = jest.fn().mockImplementation(() => {
		setTimeout(() => {
			if (this.onload) {
				this.onload({ target: { result: 'data:image/jpeg;base64,mockbase64data' } });
			}
		}, 0);
	});
};

// Check if GPU is available and define environment variables
global.process.env.HAS_GPU = process.env.HAS_GPU || 'false';
global.process.env.GPU_MEM_GB = process.env.GPU_MEM_GB || '0';
global.process.env.CAN_RUN_WEBGPU = (process.env.HAS_GPU === 'true' &&
	parseFloat(process.env.GPU_MEM_GB || '0') >= 5) ? 'true' : 'false';

// Log GPU status for reference
console.log(`Test environment: GPU available: ${global.process.env.HAS_GPU}, Memory: ${global.process.env.GPU_MEM_GB}GB`);
console.log(`WebGPU tests enabled: ${global.process.env.CAN_RUN_WEBGPU}`);

// Add navigator.gpu for WebGPU tests if needed
if (global.process.env.HAS_GPU === 'true') {
	global.navigator = {
		gpu: {
			requestAdapter: jest.fn().mockResolvedValue({
				requestDevice: jest.fn().mockResolvedValue({
					createBuffer: jest.fn(),
					createComputePipeline: jest.fn(),
					createCommandEncoder: jest.fn(),
					queue: { submit: jest.fn() }
				})
			})
		}
	};
}

// Mock pipeline function for transformers.js
// This will be used in tests without actually loading the model
jest.mock('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.2.1', () => ({
	pipeline: jest.fn().mockImplementation(() => {
		return async (imgSrc, options) => {
			return [
				{
					box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.9 },
					label: 'test object',
					score: 0.95
				}
			];
		};
	})
}), { virtual: true });
