export default {
	// Use ESM since the package.json has "type": "module"
	transform: {},
	// Resolve the Haste module naming collision issue
	modulePathIgnorePatterns: [
		"<rootDir>/janus-webgpu/",
		"<rootDir>/smollm-webgpu/",
		"<rootDir>/webgpu-clip/",
		"<rootDir>/webgpu-nomic-embed/",
		"<rootDir>/code-completion/",
		"<rootDir>/whisper-word-timestamps/",
	],
	// Allow Jest to handle ES modules
	extensionsToTreatAsEsm: ['.jsx', '.ts', '.tsx'],
	// Create a sensible test environment for both Node.js and browser-targeted code
	testEnvironment: 'node',
	// Look for tests in any __tests__ directories and any files ending with .test.js/.ts
	testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
	// Allow for jest to run even if no tests are found
	passWithNoTests: true,
};
