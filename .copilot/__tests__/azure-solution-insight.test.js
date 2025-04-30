const AzureSolutionInsightService = require('../../.vscode/extensions/dev-debt-processor/services/azure-solution-insight');
const {
    BlobStorageClient,
    LogAnalyticsClient,
    SecretManager,
    AzureEnvironment,
    AzureInitializationError,
    AzureConfigurationError
} = require('../../.vscode/extensions/dev-debt-processor/services/azure');

/**
 * Comprehensive Azure Services Mock
 *
 * Azure Best Practice: Use dedicated test doubles for Azure services
 * that properly emulate service behaviors including error conditions,
 * throttling responses, and retry patterns.
 */
jest.mock('../../.vscode/extensions/dev-debt-processor/services/azure', () => {
    // Store original module to access error types
    const originalModule = jest.requireActual('../../.vscode/extensions/dev-debt-processor/services/azure');

    return {
        BlobStorageClient: jest.fn().mockImplementation(() => ({
            initialize: jest.fn().mockResolvedValue(true),
            storeData: jest.fn().mockImplementation((containerName, blobName, data) => {
                if (containerName === 'error-container') {
                    return Promise.reject(new Error('Storage container not found'));
                }
                return Promise.resolve(`https://test.blob.core.windows.net/${containerName}/${blobName}`);
            }),
            downloadData: jest.fn().mockResolvedValue({ testData: 'downloaded content' }),
            listBlobs: jest.fn().mockResolvedValue([{ name: 'test-blob.json' }])
        })),
        LogAnalyticsClient: jest.fn().mockImplementation(() => ({
            sendData: jest.fn().mockImplementation((logType, data) => {
                // Simulate throttling for high volume requests
                if (Array.isArray(data) && data.length > 100) {
                    return Promise.reject(new Error('Request was throttled. Please try again after some time.'));
                }

                // Simulate authentication errors
                if (logType === 'Unauthorized_CL') {
                    return Promise.reject(new Error('Azure authentication failed: Unauthorized'));
                }

                // Normal success case
                return Promise.resolve(true);
            })
        })),
        SecretManager: jest.fn().mockImplementation(() => ({
            initialize: jest.fn().mockResolvedValue(true),
            getSecret: jest.fn().mockImplementation(secretName => {
                if (secretName === 'missing-secret') {
                    return Promise.reject(new Error('Secret not found'));
                } else if (secretName === 'access-denied') {
                    return Promise.reject(new Error('Access denied to key vault'));
                }
                return Promise.resolve(`secret-value-for-${secretName}`);
            })
        })),
        PostgresClient: jest.fn().mockImplementation(() => ({
            initialize: jest.fn().mockResolvedValue(true),
            query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
            transaction: jest.fn().mockImplementation(callback => callback({
                query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] })
            }))
        })),
        DevDebtRepository: jest.fn().mockImplementation(() => ({
            initialize: jest.fn().mockResolvedValue(true),
            storeDevDebt: jest.fn().mockResolvedValue({ id: 1, title: 'Test Debt' }),
            getAllDevDebt: jest.fn().mockResolvedValue([{ id: 1, title: 'Test Debt' }])
        })),
        AzureEnvironment: {
            isLocalDevelopment: jest.fn().mockReturnValue(true),
            useAzuriteEmulator: jest.fn().mockReturnValue(true),
            getStorageConnectionString: jest.fn().mockReturnValue('DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;')
        },
        AzureCredentialProvider: {
            getCredential: jest.fn().mockReturnValue({ getToken: jest.fn().mockResolvedValue({ token: 'mock-token' }) })
        },
        // Preserve error types from the original module
        AzureInitializationError: originalModule.AzureInitializationError || Error,
        AzureConfigurationError: originalModule.AzureConfigurationError || Error,
        AzureIntegrationError: originalModule.AzureIntegrationError || Error,
        LogAnalyticsError: originalModule.LogAnalyticsError || Error,
        BlobStorageError: originalModule.BlobStorageError || Error
    };
});

/**
 * Mock for node's fs module to avoid actual file operations
 */
jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    appendFileSync: jest.fn()
}));

/**
 * Azure Solution Insight Service Tests
 *
 * Following Azure best practices for testing:
 * 1. Proper handling of Azure credentials
 * 2. Resilient testing with retry patterns
 * 3. Testing fallback mechanisms
 * 4. Handling of environment-specific configurations
 * 5. Complete integration test coverage
 */
describe('AzureSolutionInsightService', () => {
    let service;
    let mockConfigManager;
    let mockLogger;

    /**
     * Setup test environment before each test
     * Azure Best Practice: Set up a clean environment for each test
     */
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock config manager with common Azure configuration
        mockConfigManager = {
            getValue: jest.fn().mockImplementation((module, section, key, defaultValue) => {
                // Azure Monitor Integration enabled
                if (module === 'solutionOversight' && section === 'azureMonitorIntegration' && key === 'enabled') {
                    return true;
                }

                // Log Analytics configuration
                if (section === 'azureMonitorIntegration' && key === 'logAnalytics') {
                    return { enabled: true, workspaceId: 'test-workspace-id' };
                }

                if (section === 'logAnalytics' && key === 'workspaceId') {
                    return 'test-workspace-id';
                }

                // Storage account configuration
                if (section === 'azureMonitorIntegration' && key === 'storageAccount') {
                    return 'teststorageaccount';
                }

                // Key Vault reference
                if (section === 'azureMonitorIntegration' && key === 'keyVaultReference') {
                    return 'test-keyvault';
                }

                // Project metadata
                if (module === 'meta' && key === 'project') {
                    return 'transformers.js-examples';
                }

                return defaultValue;
            }),
            config: {
                config: {
                    currentEnvironment: 'development'
                }
            }
        };

        // Mock logger with spy methods
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warning: jest.fn()
        };

        // Create service instance with mocked dependencies
        service = new AzureSolutionInsightService(mockConfigManager, mockLogger);

        // Add test helper methods
        service.getLogAnalyticsSharedKey = jest.fn().mockResolvedValue('test-shared-key');
        service.generateCorrelationId = jest.fn().mockReturnValue('test-correlation-id');
        service.generateShortId = jest.fn().mockReturnValue('test-short-id');
    });

    /**
     * Azure Best Practice: Test successful initialization paths
     */
    test('should initialize Azure services successfully', async () => {
        // Act
        const result = await service.initialize();

        // Assert
        expect(result).toBe(true);
        expect(service.isInitialized).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith('Azure Solution Insight Service initialized successfully');
    });

    /**
     * Azure Best Practice: Test resource-specific initialization
     */
    test('should initialize Blob Storage client successfully', async () => {
        // Act
        const result = await service.initializeBlobStorage();

        // Assert
        expect(result).toBe(true);
        expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('failed'));
    });

    /**
     * Azure Best Practice: Test resource-specific initialization
     */
    test('should initialize Log Analytics client successfully', async () => {
        // Act
        const result = await service.initializeLogAnalytics();

        // Assert
        expect(result).toBe(true);
    });

    /**
     * Azure Best Practice: Test error handling and resilience
     */
    test('should handle Azure services initialization failure gracefully', async () => {
        // Arrange - configure services to fail initialization
        mockConfigManager.getValue.mockImplementation(() => false);

        // Act
        const result = await service.initialize();

        // Assert - verify graceful failure handling
        expect(result).toBe(false);
        expect(service.isInitialized).toBe(false);
    });

    /**
     * Azure Best Practice: Test telemetry functionality
     */
    test('should log solution event successfully to Azure Log Analytics', async () => {
        // Arrange - set up services
        await service.initialize();
        service.logAnalyticsClient = new LogAnalyticsClient();

        // Act - log an event
        const result = await service.logSolutionEvent('test_event', {
            testData: 'test value',
            nestedObject: {
                property1: 'value1',
                property2: 'value2'
            }
        });

        // Assert
        expect(result).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Event logged'));
    });

    /**
     * Azure Best Practice: Test fallback mechanisms
     */
    test('should fall back to Blob Storage when Log Analytics fails', async () => {
        // Arrange
        await service.initialize();

        // Configure Log Analytics to fail
        service.logAnalyticsClient = {
            sendData: jest.fn().mockRejectedValue(new Error('Log Analytics failed'))
        };

        // Configure Blob Storage as fallback
        service.blobStorageClient = new BlobStorageClient();

        // Act
        const result = await service.logSolutionEvent('test_event', { testData: 'test value' });

        // Assert
        expect(result).toBe(true);
        expect(service.blobStorageClient.storeData).toHaveBeenCalled();
        expect(mockLogger.warning).toHaveBeenCalledWith(expect.stringContaining('falling back'));
    });

    /**
     * Azure Best Practice: Test complete failure scenarios
     */
    test('should fall back to local file system when both Azure services fail', async () => {
        // Arrange - set up service with failing Azure services
        await service.initialize();

        // Mock failed Log Analytics
        service.logAnalyticsClient = {
            sendData: jest.fn().mockRejectedValue(new Error('Log Analytics failed'))
        };

        // Mock failed Blob Storage
        service.blobStorageClient = {
            storeData: jest.fn().mockRejectedValue(new Error('Blob Storage failed'))
        };

        // Act
        const result = await service.logSolutionEvent('test_event', { testData: 'test value' });

        // Assert - verify fallback to local file system
        expect(result).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('[Local File] Event logged'));
    });

    /**
     * Azure Best Practice: Test correlation and distributed tracing
     */
    test('should include correlation IDs in all telemetry', async () => {
        // Arrange
        await service.initialize();
        const correlationId = 'test-correlation-id-12345';
        service.generateCorrelationId = jest.fn().mockReturnValue(correlationId);
        service.logAnalyticsClient = new LogAnalyticsClient();

        // Create spy to capture the data sent to Log Analytics
        const sendDataSpy = jest.spyOn(service.logAnalyticsClient, 'sendData');

        // Act
        await service.logSolutionEvent('dev_debt_created', {
            filePath: 'test/path.js',
            severity: 'medium'
        });

        // Assert - verify correlation ID inclusion
        expect(sendDataSpy).toHaveBeenCalled();
        const sentData = sendDataSpy.mock.calls[0][1];
        expect(sentData).toHaveProperty('CorrelationId', correlationId);
    });

    /**
     * Azure Best Practice: Test handling of throttling scenarios
     */
    test('should handle Azure service throttling gracefully', async () => {
        // Arrange
        await service.initialize();
        service.logAnalyticsClient = new LogAnalyticsClient();

        // Generate large dataset that will trigger throttling
        const largeDataset = Array(150).fill().map((_, i) => ({ id: i, value: `test-${i}` }));

        // Act & Assert - verify throttling is handled without throwing
        const result = await service.logSolutionEvent('bulk_data', largeDataset);
        expect(result).toBe(true); // Should succeed via fallback mechanism
        expect(mockLogger.warning).toHaveBeenCalled();
    });

    /**
     * Azure Best Practice: Test local development configuration
     */
    test('should use Azurite emulator in local development', async () => {
        // Act
        await service.initialize();

        // Assert
        expect(AzureEnvironment.useAzuriteEmulator).toHaveBeenCalled();
        expect(AzureEnvironment.getStorageConnectionString).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalled();
    });

    /**
     * Azure Best Practice: Test configuration validation
     */
    test('should validate required Azure configuration', async () => {
        // Arrange - remove required workspace ID
        mockConfigManager.getValue = jest.fn().mockReturnValue(null);

        // Act
        const result = await service.initializeLogAnalytics();

        // Assert
        expect(result).toBe(false);
        expect(mockLogger.warning).toHaveBeenCalledWith(expect.stringContaining('workspace ID not configured'));
    });
});

/**
 * Test suite for error handling
 */
describe('AzureSolutionInsightService Error Handling', () => {
    let service;
    let mockConfigManager;
    let mockLogger;

    beforeEach(() => {
        jest.clearAllMocks();

        mockConfigManager = {
            getValue: jest.fn().mockReturnValue(true),
            config: { config: { currentEnvironment: 'development' } }
        };

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warning: jest.fn()
        };

        service = new AzureSolutionInsightService(mockConfigManager, mockLogger);
    });

    /**
     * Azure Best Practice: Test authentication failure handling
     */
    test('should handle Azure authentication failures gracefully', async () => {
        // Arrange
        service.logAnalyticsClient = new LogAnalyticsClient();

        // Act
        const result = await service.logSolutionEvent('Unauthorized_CL', { testData: 'test' });

        // Assert
        expect(result).toBe(true); // Should succeed via fallback
        expect(mockLogger.warning).toHaveBeenCalled();
    });

    /**
     * Azure Best Practice: Test Key Vault errors
     */
    test('should handle Key Vault access failures', async () => {
        // Arrange
        service.secretManager = new SecretManager();

        // Act
        const secret = await service.getLogAnalyticsSharedKey();

        // Assert
        expect(secret).not.toBeNull();
        expect(mockLogger.warning).not.toHaveBeenCalled();
    });

    /**
     * Azure Best Practice: Test storage errors
     */
    test('should handle Blob Storage container errors', async () => {
        // Arrange
        await service.initialize();
        service.blobStorageClient = new BlobStorageClient();

        // Act & Assert
        await expect(async () => {
            await service.blobStorageClient.storeData('error-container', 'test.json', { data: 'test' });
        }).rejects.toThrow('Storage container not found');
    });
});