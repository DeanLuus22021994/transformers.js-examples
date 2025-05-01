// JS_ID::HEALTH_CHECK
// filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\health-check.js
// JS_META::DESCRIPTION
// Health check script to verify the debt management assistant is running properly
// JS_META::VERSION
// Version: 1.0.0
// JS_META::AUTHOR
// Author: Transformers.js Team

// JS_IMPORT::DEPENDENCIES
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// JS_FUNCTION::MAIN
// Main health check function
function checkHealth() {
  try {
    // JS_CHECK::MODEL_CACHE
    // Verify model cache exists
    const modelCacheDir = process.env.MODEL_CACHE_DIR || '/app/model-cache';
    if (!fs.existsSync(modelCacheDir)) {
      console.error('Model cache directory not found');
      return false;
    }

    // JS_CHECK::CONFIG
    // Verify configuration exists
    const configFile = path.join('/app/config', 'debt-config.yml');
    if (!fs.existsSync(configFile)) {
      console.error('Configuration file not found');
      return false;
    }

    // JS_CHECK::NODE_PROCESS
    // Verify Node.js is working
    execSync('node -e "console.log(\'Node is working\')"');

    // JS_CHECK::PYTHON_PROCESS
    // Verify Python is working
    execSync('python3 -c "print(\'Python is working\')"');

    // JS_CHECK::TRANSFORMERS
    // Simple check for transformers import
    try {
      execSync('python3 -c "from transformers import pipeline; print(\'Transformers is working\')"');
    } catch (error) {
      console.error('Transformers library check failed:', error.message);
      return false;
    }

    console.log('Health check passed');
    return true;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

// JS_ACTION::RUN_CHECK
// Run the health check and exit with appropriate code
const isHealthy = checkHealth();
process.exit(isHealthy ? 0 : 1);

// JS_ID::FOOTER
// SchemaVersion: 1.0.0
// ScriptID: health-check
