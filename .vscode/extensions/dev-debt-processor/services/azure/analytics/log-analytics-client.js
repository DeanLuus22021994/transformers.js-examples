const fetch = require('node-fetch');
const { LogAnalyticsError } = require('../common/error-types');
const SignatureUtils = require('./signature-utils');

/**
 * Client for interacting with Azure Log Analytics
 */
class LogAnalyticsClient {
    /**
     * Create a new Log Analytics client
     * @param {string} workspaceId Log Analytics workspace ID
     * @param {string} sharedKey Log Analytics shared key
     * @param {object} logger Logger instance
     */
    constructor(workspaceId, sharedKey, logger) {
        this.workspaceId = workspaceId;
        this.sharedKey = sharedKey;
        this.logger = logger;
    }

    /**
     * Send data to Log Analytics using the Data Collector API
     * @param {string} logType The custom log type (table name)
     * @param {object|array} data The data to send (single object or array of objects)
     * @returns {Promise<boolean>} Success status
     */
    async sendData(logType, data) {
        try {
            if (!this.workspaceId) {
                throw new LogAnalyticsError('Log Analytics workspace ID not configured');
            }

            if (!this.sharedKey) {
                throw new LogAnalyticsError('Log Analytics shared key not available');
            }

            // Ensure data is an array
            const dataArray = Array.isArray(data) ? data : [data];

            // RFC1123 date format required for signature
            const date = new Date().toUTCString();

            // API version
            const apiVersion = '2016-04-01';

            // Content type for POST body
            const contentType = 'application/json';

            // Resource for signature
            const resource = '/api/logs';

            // Body content as stringified JSON
            const body = JSON.stringify(dataArray);
            const contentLength = Buffer.byteLength(body, 'utf8');

            // Create signature for authorization header using HMAC-SHA256
            const signature = SignatureUtils.createLogAnalyticsSignature(
                'POST',
                contentLength,
                contentType,
                'x-ms-date:' + date,
                resource,
                this.sharedKey
            );

            // Build the URI for the Data Collector API
            const uri = `https://${this.workspaceId}.ods.opinsights.azure.com${resource}?api-version=${apiVersion}`;

            // Set the headers required by the Data Collector API
            const headers = {
                'Authorization': `SharedKey ${this.workspaceId}:${signature}`,
                'Log-Type': logType,
                'x-ms-date': date,
                'time-generated-field': 'Timestamp', // Use this field as the timestamp
                'Content-Type': contentType,
                'Content-Length': contentLength.toString()
            };

            // Send the request using fetch API
            const response = await fetch(uri, {
                method: 'POST',
                headers: headers,
                body: body
            });

            // Check if request was successful (200 OK or 204 No Content)
            if (response.status >= 200 && response.status < 300) {
                this.logger.info(`Successfully sent ${dataArray.length} records to Log Analytics custom log: ${logType}`);
                return true;
            } else {
                const errorText = await response.text();
                throw new LogAnalyticsError(`Failed to send logs. Status: ${response.status}, Message: ${errorText}`);
            }
        } catch (error) {
            if (!(error instanceof LogAnalyticsError)) {
                error = new LogAnalyticsError(error.message);
            }
            throw error;
        }
    }
}

module.exports = LogAnalyticsClient;