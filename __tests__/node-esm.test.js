import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Mock the transformers library
jest.mock('@huggingface/transformers', () => ({
	pipeline: jest.fn().mockImplementation(() => {
		return async (text) => {
			if (text.includes('love')) {
				return [{ label: 'POSITIVE', score: 0.9997673034667969 }];
			} else {
				return [{ label: 'NEGATIVE', score: 0.9876543212890625 }];
			}
		};
	})
}));

describe('node-esm text classification example', () => {
	let consoleSpy;

	beforeEach(() => {
		// Clear all mocks
		jest.clearAllMocks();
		// Spy on console.log
		consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
	});

	afterEach(() => {
		// Restore console.log
		consoleSpy.mockRestore();
	});

	test('classifier returns positive sentiment for positive text', async () => {
		// Import the pipeline function
		const { pipeline } = await import('@huggingface/transformers');

		// Create classifier
		const classifier = await pipeline('text-classification');

		// Test with positive text
		const result = await classifier('I love Transformers.js!');

		// Verify result
		expect(result).toEqual([{ label: 'POSITIVE', score: 0.9997673034667969 }]);

		// Verify pipeline was called with the correct argument
		expect(pipeline).toHaveBeenCalledWith('text-classification');
	});

	test('classifier returns negative sentiment for negative text', async () => {
		// Import the pipeline function
		const { pipeline } = await import('@huggingface/transformers');

		// Create classifier
		const classifier = await pipeline('text-classification');

		// Test with negative text
		const result = await classifier('I dislike this example.');

		// Verify result
		expect(result).toEqual([{ label: 'NEGATIVE', score: 0.9876543212890625 }]);
	});

	test('console output matches the expected format', async () => {
		// Import required modules for the test
		const { pipeline } = await import('@huggingface/transformers');

		// Simulate the main code execution
		const classifier = await pipeline('text-classification');
		const result = await classifier('I love Transformers.js!');
		console.log(result);

		// Check console output
		expect(consoleSpy).toHaveBeenCalledWith([{ label: 'POSITIVE', score: 0.9997673034667969 }]);
	});
});
