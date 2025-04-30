import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Mock the wavefile library
jest.mock('wavefile', () => ({
	WaveFile: jest.fn().mockImplementation(() => ({
		toBitDepth: jest.fn(),
		toSampleRate: jest.fn(),
		getSamples: jest.fn().mockReturnValue([[1, 2, 3, 4], [5, 6, 7, 8]])
	}))
}));

// Mock the fetch function
global.fetch = jest.fn().mockImplementation(() =>
	Promise.resolve({
		arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
	})
);

// Mock the transformers library
jest.mock('@huggingface/transformers', () => ({
	pipeline: jest.fn().mockImplementation(() => {
		const processor = {
			feature_extractor: {
				config: {
					sampling_rate: 16000
				}
			}
		};

		const transcriber = async (audio) => {
			return { text: ' And so my fellow Americans ask not what your country can do for you, ask what you can do for your country.' };
		};

		// Attach the processor to the transcriber function
		transcriber.processor = processor;

		return transcriber;
	})
}));

describe('whisper-node speech recognition example', () => {
	let consoleSpy, consoleTimeSpy, consoleTimeEndSpy;

	beforeEach(() => {
		// Clear all mocks
		jest.clearAllMocks();

		// Spy on console methods
		consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
		consoleTimeSpy = jest.spyOn(console, 'time').mockImplementation(() => { });
		consoleTimeEndSpy = jest.spyOn(console, 'timeEnd').mockImplementation(() => { });
	});

	afterEach(() => {
		// Restore console methods
		consoleSpy.mockRestore();
		consoleTimeSpy.mockRestore();
		consoleTimeEndSpy.mockRestore();
	});

	test('read_audio function correctly processes audio data', async () => {
		// Import the read_audio function
		const { read_audio } = await import('../../whisper-node/utils.js');

		// Test with default sampling rate
		const audioData = await read_audio('https://example.com/audio.wav');

		// Verify the returned data is processed correctly
		expect(Array.isArray(audioData)).toBeTruthy();
		expect(audioData).toEqual([
			Math.sqrt(2) * (1 + 5) / 2,
			Math.sqrt(2) * (2 + 6) / 2,
			Math.sqrt(2) * (3 + 7) / 2,
			Math.sqrt(2) * (4 + 8) / 2
		]);

		// Verify fetch was called with the correct URL
		expect(fetch).toHaveBeenCalledWith('https://example.com/audio.wav');
	});

	test('transcriber correctly processes audio and returns text', async () => {
		// Import required modules
		const { pipeline } = await import('@huggingface/transformers');
		const { read_audio } = await import('../../whisper-node/utils.js');

		// Create transcriber
		const transcriber = await pipeline(
			'automatic-speech-recognition',
			'onnx-community/whisper-tiny.en',
			{ dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' } }
		);

		// Get audio data
		const audio = await read_audio(
			'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav',
			transcriber.processor.feature_extractor.config.sampling_rate
		);

		// Run transcription
		const output = await transcriber(audio);

		// Verify output
		expect(output).toEqual({
			text: ' And so my fellow Americans ask not what your country can do for you, ask what you can do for your country.'
		});

		// Verify pipeline was called with the correct arguments
		expect(pipeline).toHaveBeenCalledWith(
			'automatic-speech-recognition',
			'onnx-community/whisper-tiny.en',
			{ dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' } }
		);
	});
});
