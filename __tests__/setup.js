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
