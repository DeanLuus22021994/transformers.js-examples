const crypto = require('crypto');

/**
 * Utility for creating Azure API signatures
 */
class AzureSignatureUtils {
    /**
     * Create a signature for Log Analytics Data Collector API
     * @param {string} method HTTP method (POST)
     * @param {number} contentLength Content length
     * @param {string} contentType Content type (application/json)
     * @param {string} xMsDate x-ms-date header value
     * @param {string} resource Resource path
     * @param {string} sharedKey Shared key for the workspace
     * @returns {string} Base64 encoded signature
     */
    static createLogAnalyticsSignature(method, contentLength, contentType, xMsDate, resource, sharedKey) {
        // Build the signature string
        const stringToSign = [
            method,
            contentLength.toString(),
            contentType,
            xMsDate,
            resource
        ].join('\n');

        // Create the signature with HMAC-SHA256
        const hmac = crypto.createHmac('sha256', Buffer.from(sharedKey, 'base64'));
        hmac.update(stringToSign, 'utf8');

        // Return the base64 encoded signature
        return hmac.digest('base64');
    }
}

module.exports = AzureSignatureUtils;