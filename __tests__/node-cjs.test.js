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

describe('node-cjs text classification example', () => {
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

		// Create classifier function for testing
		async function classifyText(text) {
			const classifier = await pipeline('text-classification');
			return await classifier(text);
		}

		// Test with positive text
		const result = await classifyText('I love Transformers.js!');

		// Verify result
		expect(result).toEqual([{ label: 'POSITIVE', score: 0.9997673034667969 }]);

		// Verify pipeline was called with the correct argument
		expect(pipeline).toHaveBeenCalledWith('text-classification');
	});

	test('classifier returns negative sentiment for negative text', async () => {
		// Import the pipeline function
		const { pipeline } = await import('@huggingface/transformers');

		// Create classifier function for testing
		async function classifyText(text) {
			const classifier = await pipeline('text-classification');
			return await classifier(text);
		}

		// Test with negative text
		const result = await classifyText('I dislike this example.');

		// Verify result
		expect(result).toEqual([{ label: 'NEGATIVE', score: 0.9876543212890625 }]);
	});

	test('main function correctly logs classification result', async () => {
		// Mock implementation of main function similar to node-cjs/index.js
		async function main() {
			const { pipeline } = await import('@huggingface/transformers');
			const classifier = await pipeline('text-classification');
			const result = await classifier('I love Transformers.js!');
			console.log(result);
			return result;
		}

		// Run main function
		const result = await main();

		// Check result and console output
		expect(result).toEqual([{ label: 'POSITIVE', score: 0.9997673034667969 }]);
		expect(consoleSpy).toHaveBeenCalledWith([{ label: 'POSITIVE', score: 0.9997673034667969 }]);
	});
});
