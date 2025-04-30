/**
 * Technical Debt Tags Example File
 * This file demonstrates how to use the technical debt tags in your code
 */

/**
 * Process large dataset 
 * #debt: This function has O(n²) complexity and needs optimization for large datasets
 */
function processLargeDataset(data) {
  // Implementation with quadratic complexity
  return data.map(item => data.filter(other => other.id !== item.id));
}

/**
 * Helper function for data transformation
 * #improve: Add support for custom transformation functions
 */
function transformData(input) {
  // Basic implementation
  return input.map(item => ({ ...item, processed: true }));
}

/**
 * Legacy authentication method
 * #refactor: Replace with OAuth implementation
 */
function authenticateUser(username, password) {
  // Legacy implementation
  return username === 'admin' && password === 'password';
}

/**
 * Temporary workaround for API issue
 * #fixme: Remove this workaround once API bug #123 is fixed
 */
function apiWorkaround(data) {
  // Hacky solution
  if (!data.timestamp) data.timestamp = Date.now();
  return data;
}

/**
 * Placeholder for future implementation
 * #todo: Implement caching mechanism
 */
function getCachedData(key) {
  // No caching yet
  return fetchFreshData(key);
}

// Export functions
module.exports = {
  processLargeDataset,
  transformData,
  authenticateUser,
  apiWorkaround,
  getCachedData
};
