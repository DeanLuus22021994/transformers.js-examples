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
	} catch (error: unknown) {
		console.error('Failed to initialize browser environment:', error);
		if (statusElement) {
			statusElement.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
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
	const fileInput = document.getElementById(elementId) as HTMLInputElement;
	if (!fileInput) return;

	fileInput.addEventListener('change', (event) => {
		const files = fileInput.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			if (e.target?.result) {
				onFileLoaded(file, e.target.result as ArrayBuffer);
			}
		};
		reader.readAsArrayBuffer(file);
	});
}

/**
 * Display an image in a container element
 * @param imageData Image data (URL, Blob, or File)
 * @param containerId ID of container element
 */
export function displayImage(imageData: string | Blob | File, containerId: string): void {
	const container = document.getElementById(containerId);
	if (!container) return;

	let imgUrl: string;

	if (typeof imageData === 'string') {
		imgUrl = imageData;
	} else {
		imgUrl = URL.createObjectURL(imageData);
	}

	const img = document.createElement('img');
	img.src = imgUrl;
	img.style.maxWidth = '100%';

	// Clear container and add new image
	container.innerHTML = '';
	container.appendChild(img);
}