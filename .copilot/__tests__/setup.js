// Set up global environment variables for tests
process.env.NODE_ENV = 'test';

// Set up environment variables for Azure testing
process.env.AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;";
process.env.AZURE_LOG_WORKSPACE_ID = "test-workspace-id";
process.env.AZURE_LOG_KEY = "test-key";

// Configure Jest to handle timers
jest.setTimeout(30000); // Increase default timeout to 30s for Azure operations

// Create global mocks for browser environments
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    status: 200,
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
);

// Azure model configuration - Replace Qwen with BitNet
process.env.MODEL_REGISTRY = 'huggingface';
process.env.MODEL_ID = 'microsoft/bitnet-b1.58-2B-4T'; // Replace qwen2.5-coder:7b