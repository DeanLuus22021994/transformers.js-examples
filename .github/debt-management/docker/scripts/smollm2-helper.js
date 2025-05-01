// JS_ID::SMOLLM2_HELPER
// filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\smollm2-helper.js
// JS_META::DESCRIPTION
// Helper module for SmolLM2-1.7B model integration with RTX acceleration
// JS_META::VERSION
// Version: 1.0.0
// JS_META::AUTHOR
// Author: Transformers.js Team

// JS_IMPORT::DEPENDENCIES
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const yaml = require('js-yaml');

// JS_CONFIG::CONSTANTS
// Define constants for model configuration
const MODEL_CACHE_DIR = process.env.MODEL_CACHE_DIR || '/app/model-cache';
const MODEL_ID = 'HuggingFaceTB/SmolLM2-1.7B-intermediate-checkpoints';
const MODEL_REVISION = 'step-125000';
const MODEL_CONFIG_PATH = '/app/config/model-config.json';

// JS_TRACE::INIT
// Initialize the trace log for tracking system operations
const traceLog = [];

// JS_FUNCTION::LOG_TRACE
// Log operations for traceability
function logTrace(operation, details, status = 'info') {
  const timestamp = new Date().toISOString();
  const traceEntry = {
    timestamp,
    operation,
    details,
    status
  };
  traceLog.push(traceEntry);

  // Also console log for immediate visibility
  const statusColor = status === 'error' ? 'red' :
                     (status === 'warning' ? 'yellow' :
                     (status === 'success' ? 'green' : 'cyan'));
  console.log(chalk[statusColor](`[TRACE:${timestamp}] ${operation}: ${details}`));

  return traceEntry;
}

// JS_CLASS::SMOLLM2_HELPER
// Main helper class for SmolLM2 model operations
class SmolLM2Helper {
  // JS_METHOD::CONSTRUCTOR
  constructor(options = {}) {
    this.options = {
      modelId: MODEL_ID,
      revision: MODEL_REVISION,
      cacheDir: MODEL_CACHE_DIR,
      useGpu: true,
      quantize: true,
      ...options
    };

    this.modelReady = false;
    this.modelStats = {
      lastUsed: null,
      totalInferences: 0,
      averageLatency: 0,
      errorRate: 0
    };

    logTrace('INIT', `SmolLM2Helper initialized with options: ${JSON.stringify(this.options)}`);
  }

  // JS_METHOD::CHECK_ENVIRONMENT
  // Check if the environment supports the model requirements
  async checkEnvironment() {
    logTrace('ENV_CHECK', 'Checking environment for model compatibility');

    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [
        '-c',
        `
import sys
import json
import torch
import os

environment_info = {
    "python_version": sys.version,
    "torch_version": torch.__version__,
    "cuda_available": torch.cuda.is_available(),
    "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
    "model_cache_exists": os.path.exists("${this.options.cacheDir}"),
    "free_disk_space_gb": os.statvfs("${this.options.cacheDir}").f_bfree * os.statvfs("${this.options.cacheDir}").f_frsize / (1024**3) if os.path.exists("${this.options.cacheDir}") else 0
}

if torch.cuda.is_available():
    for i in range(torch.cuda.device_count()):
        environment_info[f"gpu_{i}_name"] = torch.cuda.get_device_name(i)
        environment_info[f"gpu_{i}_memory_gb"] = torch.cuda.get_device_properties(i).total_memory / (1024**3)

print(json.dumps(environment_info))
        `
      ]);

      let output = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const envInfo = JSON.parse(output);

            // Log the environment details
            logTrace('ENV_INFO', `Python: ${envInfo.python_version}, Torch: ${envInfo.torch_version}`);
            logTrace('GPU_INFO', `CUDA available: ${envInfo.cuda_available}, GPU count: ${envInfo.gpu_count}`);

            if (!envInfo.cuda_available && this.options.useGpu) {
              logTrace('GPU_WARNING', 'GPU acceleration requested but CUDA is not available, falling back to CPU', 'warning');
              this.options.useGpu = false;
            }

            if (envInfo.model_cache_exists) {
              logTrace('CACHE_INFO', `Model cache exists with ${envInfo.free_disk_space_gb.toFixed(2)}GB free space`);
            } else {
              logTrace('CACHE_WARNING', 'Model cache directory does not exist, will create it', 'warning');
            }

            resolve({
              compatible: true,
              info: envInfo
            });
          } catch (error) {
            logTrace('ENV_ERROR', `Error parsing environment info: ${error.message}`, 'error');
            resolve({
              compatible: false,
              error: 'Failed to parse environment information'
            });
          }
        } else {
          logTrace('ENV_ERROR', 'Failed to check environment', 'error');
          resolve({
            compatible: false,
            error: 'Failed to execute environment check'
          });
        }
      });
    });
  }

  // JS_METHOD::INITIALIZE_MODEL
  // Initialize the SmolLM2 model
  async initializeModel() {
    const envCheck = await this.checkEnvironment();
    if (!envCheck.compatible) {
      logTrace('INIT_ERROR', `Cannot initialize model: ${envCheck.error}`, 'error');
      return false;
    }

    logTrace('MODEL_INIT', `Initializing SmolLM2 model (${this.options.modelId}, revision ${this.options.revision})`);

    return new Promise((resolve) => {
      const useGpu = this.options.useGpu && envCheck.info.cuda_available;
      const pythonProcess = spawn('python3', [
        '-c',
        `
import sys
import json
import torch
import time
from transformers import AutoModelForCausalLM, AutoTokenizer

try:
    start_time = time.time()
    print(json.dumps({"status": "starting", "message": "Loading model and tokenizer"}))
    sys.stdout.flush()

    # Configure device
    device = "cuda" if ${useGpu} and torch.cuda.is_available() else "cpu"
    print(json.dumps({"status": "progress", "message": f"Using device: {device}"}))
    sys.stdout.flush()

    # Configure data type for quantization
    dtype = torch.float16 if ${this.options.quantize} and device == "cuda" else torch.float32

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        "${this.options.modelId}",
        revision="${this.options.revision}",
        cache_dir="${this.options.cacheDir}"
    )

    print(json.dumps({"status": "progress", "message": "Tokenizer loaded, now loading model"}))
    sys.stdout.flush()

    # Load model with appropriate settings
    load_options = {
        "revision": "${this.options.revision}",
        "cache_dir": "${this.options.cacheDir}",
        "torch_dtype": dtype,
        "low_cpu_mem_usage": True
    }

    if device == "cuda":
        load_options["device_map"] = "auto"

    # Try to use optimized model if available
    optimized_model_path = "${this.options.cacheDir}/optimized_model_cuda.pt"
    if device == "cuda" and os.path.exists(optimized_model_path):
        print(json.dumps({"status": "progress", "message": "Loading optimized CUDA model"}))
        sys.stdout.flush()

        try:
            model = torch.jit.load(optimized_model_path)
            model = model.to(device)
            print(json.dumps({"status": "progress", "message": "Loaded optimized JIT model"}))
        except Exception as e:
            print(json.dumps({"status": "warning", "message": f"Failed to load optimized model: {str(e)}"}))
            sys.stdout.flush()
            model = AutoModelForCausalLM.from_pretrained("${this.options.modelId}", **load_options)
    else:
        model = AutoModelForCausalLM.from_pretrained("${this.options.modelId}", **load_options)

    # Create pipeline
    print(json.dumps({"status": "progress", "message": "Creating inference pipeline"}))
    sys.stdout.flush()

    generation_config = {
        "max_length": 150,
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 50,
        "do_sample": True
    }

    # Test inference
    print(json.dumps({"status": "progress", "message": "Running test inference"}))
    sys.stdout.flush()

    input_text = "Analyze this code for technical debt:"
    input_ids = tokenizer(input_text, return_tensors="pt").to(device)

    with torch.inference_mode():
        outputs = model.generate(
            input_ids["input_ids"],
            max_length=50,
            temperature=0.7,
            top_p=0.9,
            do_sample=True
        )

    result = tokenizer.batch_decode(outputs, skip_special_tokens=True)

    # Calculate initialization stats
    end_time = time.time()
    init_time = end_time - start_time

    # Return success
    print(json.dumps({
        "status": "success",
        "message": "Model initialized successfully",
        "device": device,
        "quantized": ${this.options.quantize},
        "init_time_seconds": init_time,
        "test_output": result[0]
    }))

except Exception as e:
    import traceback
    print(json.dumps({
        "status": "error",
        "message": str(e),
        "traceback": traceback.format_exc()
    }))
        `
      ]);

      let output = '';
      let errorOutput = '';
      let progressMessages = [];

      pythonProcess.stdout.on('data', (data) => {
        const dataStr = data.toString();
        output += dataStr;

        // Try to parse JSON progress messages
        try {
          const lines = dataStr.trim().split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
              const progressData = JSON.parse(line);
              progressMessages.push(progressData);

              // Log progress message
              const status = progressData.status === 'error' ? 'error' :
                            (progressData.status === 'warning' ? 'warning' : 'info');
              logTrace(`MODEL_${progressData.status.toUpperCase()}`, progressData.message, status);
            }
          }
        } catch (e) {
          // Ignore parsing errors for non-JSON output
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        logTrace('MODEL_ERROR', data.toString(), 'error');
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Check the last message to see if initialization was successful
          const lastMessage = progressMessages[progressMessages.length - 1];
          if (lastMessage && lastMessage.status === 'success') {
            this.modelReady = true;
            this.modelStats.lastUsed = new Date();

            logTrace('MODEL_READY', `Model initialized in ${lastMessage.init_time_seconds.toFixed(2)}s on ${lastMessage.device}`, 'success');

            resolve({
              success: true,
              device: lastMessage.device,
              quantized: lastMessage.quantized,
              initTime: lastMessage.init_time_seconds
            });
          } else {
            logTrace('MODEL_ERROR', 'Model initialization returned success code but no success message', 'error');
            this.modelReady = false;
            resolve({
              success: false,
              error: 'Initialization did not complete properly'
            });
          }
        } else {
          logTrace('MODEL_ERROR', `Model initialization failed with code ${code}: ${errorOutput}`, 'error');
          this.modelReady = false;
          resolve({
            success: false,
            error: `Exit code ${code}: ${errorOutput}`
          });
        }
      });
    });
  }

  // JS_METHOD::ANALYZE_CODE
  // Analyze code for technical debt using the SmolLM2 model
  async analyzeCode(code, language = 'javascript', options = {}) {
    if (!this.modelReady) {
      logTrace('ANALYSIS_ERROR', 'Cannot analyze code: model not initialized', 'error');
      return {
        success: false,
        error: 'Model not initialized'
      };
    }

    // Start timing for latency tracking
    const startTime = Date.now();

    logTrace('ANALYSIS_START', `Analyzing ${language} code (${code.length} chars)`);

    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [
        '-c',
        `
import sys
import json
import torch
import time
from transformers import AutoModelForCausalLM, AutoTokenizer

try:
    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(
        "${this.options.modelId}",
        revision="${this.options.revision}",
        cache_dir="${this.options.cacheDir}"
    )

    # Determine device
    device = "cuda" if torch.cuda.is_available() and ${this.options.useGpu} else "cpu"

    # Either load optimized model or standard model
    optimized_model_path = "${this.options.cacheDir}/optimized_model_cuda.pt"
    if device == "cuda" and os.path.exists(optimized_model_path):
        model = torch.jit.load(optimized_model_path)
        model = model.to(device)
    else:
        dtype = torch.float16 if device == "cuda" and ${this.options.quantize} else torch.float32
        load_options = {
            "revision": "${this.options.revision}",
            "cache_dir": "${this.options.cacheDir}",
            "torch_dtype": dtype,
            "low_cpu_mem_usage": True
        }

        if device == "cuda":
            load_options["device_map"] = "auto"

        model = AutoModelForCausalLM.from_pretrained("${this.options.modelId}", **load_options)

    # Create the prompt
    prompt = """
Analyze the following ${language} code for technical debt issues:

\`\`\`${language}
${code}
\`\`\`

Identify issues in the following categories:
1. Maintainability Issues
2. Performance Problems
3. Code Smells
4. Security Concerns
5. Best Practice Violations

Format your response as a JSON object with the following structure:
{
  "issues": [
    {"line": <line_number>, "category": <category>, "description": <issue_description>, "severity": <high|medium|low>}
  ],
  "suggestions": [
    <suggestion_text>
  ],
  "score": <0-100>
}
"""

    # Tokenize input
    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    # Generate analysis
    with torch.inference_mode():
        outputs = model.generate(
            inputs["input_ids"],
            max_length=1500,
            temperature=0.3,
            top_p=0.95,
            do_sample=True
        )

    # Decode output
    result = tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]

    # Try to extract JSON from the result
    try:
        # Find JSON output in the response
        json_start = result.find('{')
        json_end = result.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_result = result[json_start:json_end]
            # Parse and validate JSON
            parsed_result = json.loads(json_result)
            print(json.dumps({
                "status": "success",
                "result": parsed_result
            }))
        else:
            # Fallback if no JSON found
            print(json.dumps({
                "status": "warning",
                "result": {
                    "issues": [],
                    "suggestions": ["Unable to extract structured analysis. Here's the raw output:", result],
                    "score": 0
                }
            }))
    except json.JSONDecodeError:
        # Fallback for invalid JSON
        print(json.dumps({
            "status": "warning",
            "result": {
                "issues": [],
                "suggestions": ["Model generated invalid JSON. Here's the truncated output:", result[:500] + "..."],
                "score": 0
            }
        }))

except Exception as e:
    import traceback
    print(json.dumps({
        "status": "error",
        "message": str(e),
        "traceback": traceback.format_exc()
    }))
        `
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Update model stats
        this.modelStats.totalInferences++;
        const endTime = Date.now();
        const latency = (endTime - startTime) / 1000; // in seconds

        // Update average latency with running average
        this.modelStats.averageLatency =
          (this.modelStats.averageLatency * (this.modelStats.totalInferences - 1) + latency) /
          this.modelStats.totalInferences;

        this.modelStats.lastUsed = new Date();

        if (code === 0 && output) {
          try {
            const result = JSON.parse(output);

            if (result.status === 'success') {
              logTrace('ANALYSIS_COMPLETE', `Analysis completed in ${latency.toFixed(2)}s with ${result.result.issues?.length || 0} issues`, 'success');

              resolve({
                success: true,
                analysis: result.result,
                latency
              });
            } else if (result.status === 'warning') {
              logTrace('ANALYSIS_WARNING', `Analysis completed with warnings: ${result.message || 'No structured output'}`, 'warning');

              resolve({
                success: true,
                analysis: result.result,
                latency,
                warning: result.message
              });
            } else {
              logTrace('ANALYSIS_ERROR', `Analysis error: ${result.message}`, 'error');
              this.modelStats.errorRate =
                (this.modelStats.errorRate * (this.modelStats.totalInferences - 1) + 1) /
                this.modelStats.totalInferences;

              resolve({
                success: false,
                error: result.message,
                latency
              });
            }
          } catch (error) {
            logTrace('ANALYSIS_ERROR', `Error parsing analysis result: ${error.message}`, 'error');
            this.modelStats.errorRate =
              (this.modelStats.errorRate * (this.modelStats.totalInferences - 1) + 1) /
              this.modelStats.totalInferences;

            resolve({
              success: false,
              error: `Failed to parse output: ${error.message}`,
              latency
            });
          }
        } else {
          logTrace('ANALYSIS_ERROR', `Analysis process failed with code ${code}: ${errorOutput}`, 'error');
          this.modelStats.errorRate =
            (this.modelStats.errorRate * (this.modelStats.totalInferences - 1) + 1) /
            this.modelStats.totalInferences;

          resolve({
            success: false,
            error: `Process failed (${code}): ${errorOutput}`,
            latency
          });
        }
      });
    });
  }

  // JS_METHOD::GET_MODEL_STATUS
  // Get current model status and statistics
  getModelStatus() {
    return {
      ready: this.modelReady,
      stats: this.modelStats,
      options: this.options,
      traceEntries: traceLog.length
    };
  }

  // JS_METHOD::GET_TRACE_LOG
  // Get the trace log for debugging and monitoring
  getTraceLog(limit = 100, filter = null) {
    let filteredLog = traceLog;

    if (filter) {
      if (filter.status) {
        filteredLog = filteredLog.filter(entry => entry.status === filter.status);
      }
      if (filter.operation) {
        filteredLog = filteredLog.filter(entry => entry.operation.includes(filter.operation));
      }
    }

    // Return most recent entries first
    return filteredLog.slice(-limit).reverse();
  }
}

// JS_EXPORT::MODULE
module.exports = {
  SmolLM2Helper,
  logTrace,
  MODEL_ID,
  MODEL_REVISION
};

// JS_ID::FOOTER
// SchemaVersion: 1.0.0
// ModuleID: smollm2-helper
