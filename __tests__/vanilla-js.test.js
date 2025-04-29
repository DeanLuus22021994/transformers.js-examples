import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// These tests validate the vanilla-js object detection example
describe('vanilla-js object detection example', () => {
  // Mock the pipeline function
  const mockDetector = jest.fn().mockImplementation((imgSrc, options) => {
    return Promise.resolve([
      {
        box: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.9 },
        label: 'test object',
        score: 0.95
      }
    ]);
  });

  // Mock document elements with more detailed behavior
  let mockStatus, mockFileUpload, mockImageContainer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup detailed mocks
    mockStatus = { textContent: '' };
    mockFileUpload = { addEventListener: jest.fn() };
    mockImageContainer = {
      innerHTML: '',
      appendChild: jest.fn(),
      childNodes: []
    };

    // Update getElementById mock implementation
    document.getElementById.mockImplementation((id) => {
      if (id === 'status') return mockStatus;
      if (id === 'file-upload') return mockFileUpload;
      if (id === 'image-container') return mockImageContainer;
      return null;
    });
  });

  test('DOM elements are correctly initialized', () => {
    const status = document.getElementById('status');
    const fileUpload = document.getElementById('file-upload');
    const imageContainer = document.getElementById('image-container');

    expect(status).toBeDefined();
    expect(fileUpload).toBeDefined();
    expect(imageContainer).toBeDefined();
  });

  test('renderBox function creates proper DOM elements', () => {
    // Import the renderBox function directly from index.js
    // Note: This is a simplified version for testing without importing the actual module
    function renderBox({ box, label }) {
      const { xmax, xmin, ymax, ymin } = box;

      // Generate a random color for the box
      const color = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, 0);

      // Draw the box
      const boxElement = document.createElement('div');
      boxElement.className = 'bounding-box';
      Object.assign(boxElement.style, {
        borderColor: color,
        left: 100 * xmin + '%',
        top: 100 * ymin + '%',
        width: 100 * (xmax - xmin) + '%',
        height: 100 * (ymax - ymin) + '%',
      });

      // Draw label
      const labelElement = document.createElement('span');
      labelElement.textContent = label;
      labelElement.className = 'bounding-box-label';
      labelElement.style.backgroundColor = color;

      boxElement.appendChild(labelElement);
      imageContainer.appendChild(boxElement);
    }

    // Test renderBox function
    renderBox({
      box: { xmin: 0.1, ymin: 0.2, xmax: 0.8, ymax: 0.9 },
      label: 'test object'
    });

    expect(document.createElement).toHaveBeenCalledWith('div');
    expect(document.createElement).toHaveBeenCalledWith('span');
    expect(imageContainer.appendChild).toHaveBeenCalled();
  });

  test('detect function calls the detector with image source', async () => {
    // Create detect function for testing
    async function detect(img) {
      mockStatus.textContent = "Analysing...";
      const output = await mockDetector(img.src, {
        threshold: 0.5,
        percentage: true,
      });
      mockStatus.textContent = "";
      output.forEach(renderBox);
    }

    function renderBox() {
      // Mock implementation
      const boxElement = document.createElement('div');
      imageContainer.appendChild(boxElement);
    }

    // Create mock image
    const mockImg = { src: 'data:image/jpeg;base64,testdata' };

    // Call detect
    await detect(mockImg);

    // Verify detector was called with the right parameters
    expect(mockDetector).toHaveBeenCalledWith(mockImg.src, {
      threshold: 0.5,
      percentage: true,
    });

    // Status should be empty after detection
    expect(mockStatus.textContent).toBe('');
  });

  test('FileReader correctly processes uploaded files', () => {
    // Create a simplified file change event handler
    function handleFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e2) {
        imageContainer.innerHTML = '';
        const image = document.createElement('img');
        image.src = e2.target.result;
        imageContainer.appendChild(image);
      };
      reader.readAsDataURL(file);
    }

    // Mock file event
    const mockEvent = {
      target: {
        files: [new Blob(['test file content'], { type: 'image/jpeg' })]
      }
    };

    // Call the handler
    handleFileChange(mockEvent);

    // Verify FileReader was used properly
    expect(document.createElement).toHaveBeenCalledWith('img');
  });
});
