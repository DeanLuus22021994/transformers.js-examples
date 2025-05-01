// JS_ID::HEALTH_CHECK
// filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\health-check.js
// JS_META::DESCRIPTION
// Health check script to verify the RTX-accelerated debt management assistant is running properly
// JS_META::VERSION
// Version: 1.1.0
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
    console.log('Starting comprehensive health check...');

    // JS_CHECK::MODEL_CACHE
    // Verify model cache exists
    const modelCacheDir = process.env.MODEL_CACHE_DIR || '/app/model-cache';
    if (!fs.existsSync(modelCacheDir)) {
      console.error('Model cache directory not found');
      return false;
    }
    console.log(`Model cache directory found: ${modelCacheDir}`);

    // JS_CHECK::OPTIMIZED_MODEL
    // Check for optimized model
    const optimizedModelPath = path.join(modelCacheDir, 'optimized_model_cuda.pt');
    if (fs.existsSync(optimizedModelPath)) {
      console.log('Optimized CUDA model found');
    } else {
      console.warn('Optimized CUDA model not found, will use standard model (slower)');
    }

    // JS_CHECK::CONFIG
    // Verify configuration exists
    const configFile = path.join('/app/config', 'debt-config.yml');
    if (!fs.existsSync(configFile)) {
      console.error('Configuration file not found');
      return false;
    }
    console.log(`Configuration file found: ${configFile}`);

    // JS_CHECK::CACHE_DIRS
    // Verify cache directories
    const cacheDirs = [
      process.env.UV_CACHE_DIR || '/cache/uv',
      process.env.PIP_CACHE_DIR || '/cache/pip',
      process.env.NPM_CONFIG_CACHE || '/cache/npm',
      process.env.PYTHONPYCACHEPREFIX || '/cache/pycache'
    ];

    for (const cacheDir of cacheDirs) {
      if (!fs.existsSync(cacheDir)) {
        console.warn(`Cache directory not found: ${cacheDir}, will create it`);
        try {
          fs.mkdirSync(cacheDir, { recursive: true });
        } catch (error) {
          console.error(`Failed to create cache directory ${cacheDir}:`, error.message);
        }
      }
    }

    // JS_CHECK::NODE_PROCESS
    // Verify Node.js is working
    execSync('node -e "console.log(\'Node.js runtime check: PASSED\')"');

    // JS_CHECK::PYTHON_PROCESS
    // Verify Python is working
    execSync('python3 -c "print(\'Python runtime check: PASSED\')"');

    // JS_CHECK::GPU_AVAILABILITY
    // Check for GPU availability
    try {
      const gpuCheckResult = execSync('python3 -c "import torch; print(f\'CUDA available: {torch.cuda.is_available()}\')"').toString().trim();
      console.log(gpuCheckResult);

      if (gpuCheckResult.includes('True')) {
        // If CUDA is available, get more GPU details
        const gpuDetails = execSync(`python3 -c "
import torch
if torch.cuda.is_available():
    device_count = torch.cuda.device_count()
    print(f'GPU count: {device_count}')
    for i in range(device_count):
        print(f'  - GPU {i}: {torch.cuda.get_device_name(i)}')
    print(f'Current device: {torch.cuda.current_device()}')
    print(f'Memory allocated: {torch.cuda.memory_allocated() / 1024**2:.2f} MB')
    print(f'Memory reserved: {torch.cuda.memory_reserved() / 1024**2:.2f} MB')
"
        `).toString();
        console.log(gpuDetails);
      }
    } catch (error) {
      console.warn('GPU check failed:', error.message);
      console.log('Continuing in CPU-only mode (reduced performance)');
    }

    // JS_CHECK::TRANSFORMERS
    // Comprehensive check for transformers
    try {
      const transformersCheck = execSync(`python3 -c "
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
import torch

# Print version information
print(f'Transformers version: {transformers.__version__}')
print(f'PyTorch version: {torch.__version__}')

# Check if we can initialize a simple pipeline
print('Initializing test pipeline...')
text_classifier = pipeline('text-classification', model='hf-internal-testing/tiny-random-distilbert')
result = text_classifier('This is a test')
print('Pipeline test successful')
"
      `).toString();
      console.log('Transformers check output:');
      console.log(transformersCheck);
    } catch (error) {
      console.error('Transformers library check failed:', error.message);
      return false;
    }

    // JS_CHECK::MODEL_LOAD
    // Test if we can load our actual model (lightweight check)
    try {
      execSync(`python3 -c "
import torch
import os
from transformers import AutoTokenizer

model_id = 'HuggingFaceTB/SmolLM2-1.7B-intermediate-checkpoints'
revision = 'step-125000'
cache_dir = '${modelCacheDir}'

print('Loading tokenizer to verify model access...')
tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision, cache_dir=cache_dir)
print('Tokenizer successfully loaded')

# Check if optimized model exists and can be loaded
optimized_model_path = os.path.join('${modelCacheDir}', 'optimized_model_cuda.pt')
if os.path.exists(optimized_model_path) and torch.cuda.is_available():
    print(f'Verifying optimized model can be loaded: {optimized_model_path}')
    # Just check we can load it, don't keep it in memory
    _ = torch.jit.load(optimized_model_path)
    print('Optimized model successfully loaded')
"
      `).toString();
      console.log('Model load check successful');
    } catch (error) {
      console.error('Model load check failed:', error.message);
      console.log('Error details:', error.message);
      return false;
    }

    console.log('All health checks passed successfully');
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
