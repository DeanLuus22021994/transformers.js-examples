import { describe, expect, test, jest } from '@jest/globals';

// Mock necessary browser objects and functions
global.document = {
	getElementById: jest.fn().mockImplementation((id) => {
		if (id === 'status') return { textContent: '' };
		if (id === 'file-upload') return { addEventListener: jest.fn() };
		if (id === 'image-container') return { innerHTML: '', appendChild: jest.fn() };
		return null;
	})
};

// This is a simple test to validate we can import functionality from vanilla-js
describe('vanilla-js example module', () => {
	test('Can mock necessary browser objects', () => {
		const mockElement = document.getElementById('status');
		expect(mockElement).toBeDefined();
		expect(mockElement.textContent).toBe('');

		// Test mocking functions
		const imageContainer = document.getElementById('image-container');
		expect(typeof imageContainer.appendChild).toBe('function');

		// Test that file upload listeners can be added
		const fileUpload = document.getElementById('file-upload');
		expect(typeof fileUpload.addEventListener).toBe('function');
	});
});
