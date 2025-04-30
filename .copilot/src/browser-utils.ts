import { TransformersConfig } from './types';

/**
 * Initialize the browser environment for Transformers.js
 * @param config Configuration options
 */
export async function setupBrowserEnvironment(config?: TransformersConfig): Promise<void> {
	// Apply default configuration if not provided
	const defaultConfig: TransformersConfig = {
		quantize: true,
		quantizationBits: 8,
		cacheModels: true,
		verbose: false
	};

	const finalConfig = { ...defaultConfig, ...config };

	// Setup status reporting element
	const statusElement = document.getElementById('status');
	if (statusElement) {
		statusElement.textContent = 'Initializing Transformers.js...';
	}

	try {
		// In a real implementation, would initialize transformers.js here
		console.log('Browser environment initialized with config:', finalConfig);

		if (statusElement) {
			statusElement.textContent = 'Transformers.js initialized successfully!';
		}
	} catch (error) {
		console.error('Failed to initialize browser environment:', error);
		if (statusElement) {
			statusElement.textContent = `Error: ${error.message}`;
		}
	}
}

/**
 * Setup file upload handling for model inputs
 * @param elementId ID of the file input element
 * @param onFileLoaded Callback when file is loaded
 */
export function setupFileUpload(
	elementId: string,
	onFileLoaded: (file: File, content: ArrayBuffer) => void
): void {
	const fileUpload = document.getElementById(elementId) as HTMLInputElement;
	if (!fileUpload) {
		throw new Error(`File upload element not found: ${elementId}`);
	}

	fileUpload.addEventListener('change', (event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as ArrayBuffer;
				onFileLoaded(file, content);
			};
			reader.readAsArrayBuffer(file);
		}
	});
}

/**
 * Display an image in a container element
 * @param imageData Image data (URL, Blob, or File)
 * @param containerId ID of container element
 */
export function displayImage(imageData: string | Blob | File, containerId: string): void {
	const container = document.getElementById(containerId);
	if (!container) {
		throw new Error(`Container element not found: ${containerId}`);
	}

	// Clear previous content
	container.innerHTML = '';

	const img = document.createElement('img');

	if (typeof imageData === 'string') {
		img.src = imageData;
	} else {
		img.src = URL.createObjectURL(imageData);
	}

	img.style.maxWidth = '100%';
	img.onload = () => {
		if (typeof imageData !== 'string') {
			URL.revokeObjectURL(img.src);
		}
	};

	container.appendChild(img);
}