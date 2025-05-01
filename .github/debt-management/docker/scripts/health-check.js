// JS_ID::HEALTH_CHECK
// filepath: c:\Projects\transformers.js-examples\.github\debt-management\docker\scripts\health-check.js
// JS_META::DESCRIPTION
// Health check script for technical debt management system
// JS_META::VERSION
// Version: 1.1.0
// JS_META::AUTHOR
// Author: Transformers.js Team

// JS_IMPORT::DEPENDENCIES
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

// JS_CONFIG::CONSTANTS
// Constants for health check
const REQUIRED_DIRECTORIES = [
  '/app/config',
  '/app/model-cache',
  '/app/debt-reports'
];
const MIN_DISK_SPACE_MB = 500;
const MODEL_CACHE_DIR = process.env.MODEL_CACHE_DIR || '/app/model-cache';

// JS_FUNCTION::CHECK_DIRECTORIES
// Check if required directories exist
async function checkDirectories() {
  console.log('Checking required directories...');

  const results = [];
  for (const dir of REQUIRED_DIRECTORIES) {
    const exists = fs.existsSync(dir);
    results.push({
      directory: dir,
      exists,
      status: exists ? 'ok' : 'error'
    });

    console.log(`- ${dir}: ${exists ? 'OK' : 'MISSING'}`);
  }

  return results;
}

// JS_FUNCTION::CHECK_DISK_SPACE
// Check available disk space
async function checkDiskSpace() {
  console.log('Checking available disk space...');

  return new Promise((resolve) => {
    const df = spawn('df', ['-m', '/app']);
    let output = '';

    df.stdout.on('data', (data) => {
      output += data.toString();
    });

    df.on('close', (code) => {
      if (code !== 0) {
        console.log('- ERROR: Could not check disk space');
        resolve({
          status: 'error',
          message: 'Failed to check disk space',
          availableMB: 0
        });
        return;
      }

      // Parse df output to get available space in MB
      // Example output:
      // Filesystem     1M-blocks  Used Available Use% Mounted on
      // /dev/sda1          97726 62004     30895  67% /

      try {
        const lines = output.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('Unexpected df output format');
        }

        const parts = lines[1].split(/\s+/);
        const availableMB = parseInt(parts[3], 10);

        const status = availableMB >= MIN_DISK_SPACE_MB ? 'ok' : 'warning';
        console.log(`- Available space: ${availableMB} MB (${status.toUpperCase()})`);

        resolve({
          status,
          availableMB,
          message: `${availableMB} MB available (${MIN_DISK_SPACE_MB} MB required)`
        });
      } catch (error) {
        console.log('- ERROR: Could not parse disk space information');
        resolve({
          status: 'error',
          message: `Failed to parse disk space info: ${error.message}`,
          availableMB: 0
        });
      }
    });
  });
}

// JS_FUNCTION::CHECK_GPU
// Check if CUDA GPU is available
async function checkGPU() {
  console.log('Checking GPU availability...');

  return new Promise((resolve) => {
    const python = spawn('python3', [
      '-c',
      `
import torch
import json

try:
    has_cuda = torch.cuda.is_available()
    device_count = torch.cuda.device_count() if has_cuda else 0
    devices = []

    if has_cuda:
        for i in range(device_count):
            device_name = torch.cuda.get_device_name(i)
            device_memory = torch.cuda.get_device_properties(i).total_memory / (1024**3)  # in GB
            devices.append({
                "id": i,
                "name": device_name,
                "memory_gb": round(device_memory, 2)
            })

    print(json.dumps({
        "has_cuda": has_cuda,
        "device_count": device_count,
        "devices": devices
    }))
except Exception as e:
    print(json.dumps({
        "error": str(e),
        "has_cuda": False,
        "device_count": 0,
        "devices": []
    }))
      `
    ]);

    let output = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.on('close', (code) => {
      try {
        const result = JSON.parse(output.trim());

        if (result.error) {
          console.log(`- ERROR: ${result.error}`);
          resolve({
            status: 'warning',
            available: false,
            message: `Error checking GPU: ${result.error}`
          });
          return;
        }

        if (result.has_cuda) {
          console.log(`- GPU available: ${result.device_count} device(s) detected`);
          result.devices.forEach(device => {
            console.log(`  - Device ${device.id}: ${device.name} (${device.memory_gb} GB memory)`);
          });

          resolve({
            status: 'ok',
            available: true,
            deviceCount: result.device_count,
            devices: result.devices
          });
        } else {
          console.log('- No CUDA GPU detected, will use CPU mode');
          resolve({
            status: 'warning',
            available: false,
            message: 'No CUDA GPU detected, falling back to CPU mode'
          });
        }
      } catch (error) {
        console.log('- ERROR: Could not parse GPU information');
        resolve({
          status: 'error',
          available: false,
          message: `Failed to parse GPU info: ${error.message}`
        });
      }
    });
  });
}

// JS_FUNCTION::CHECK_MODEL_CACHE
// Check if model cache exists and contains the required files
async function checkModelCache() {
  console.log('Checking model cache...');

  if (!fs.existsSync(MODEL_CACHE_DIR)) {
    console.log('- ERROR: Model cache directory does not exist');
    return {
      status: 'error',
      exists: false,
      message: 'Model cache directory does not exist'
    };
  }

  try {
    // Check if the directory contains any model files
    const files = fs.readdirSync(MODEL_CACHE_DIR);
    const hasModelFiles = files.some(file =>
      file.includes('model') ||
      file.includes('config.json') ||
      file.includes('pytorch_model.bin')
    );

    if (hasModelFiles) {
      console.log('- Model cache contains model files');
      return {
        status: 'ok',
        exists: true,
        files: files.length
      };
    } else {
      console.log('- WARNING: Model cache exists but contains no model files');
      return {
        status: 'warning',
        exists: true,
        empty: true,
        message: 'Model cache exists but contains no model files'
      };
    }
  } catch (error) {
    console.log(`- ERROR: Failed to check model cache: ${error.message}`);
    return {
      status: 'error',
      exists: true,
      message: `Failed to check model cache: ${error.message}`
    };
  }
}

// JS_FUNCTION::CHECK_PYTHON_DEPS
// Check Python dependencies
async function checkPythonDeps() {
  console.log('Checking Python dependencies...');

  return new Promise((resolve) => {
    const python = spawn('python3', [
      '-c',
      `
import json
import sys

required_packages = [
    'torch',
    'transformers',
    'numpy',
    'tokenizers'
]

results = {}

for package in required_packages:
    try:
        module = __import__(package)
        if hasattr(module, '__version__'):
            results[package] = {
                'installed': True,
                'version': module.__version__
            }
        else:
            results[package] = {
                'installed': True,
                'version': 'unknown'
            }
    except ImportError:
        results[package] = {
            'installed': False,
            'version': None
        }

print(json.dumps({
    'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
    'packages': results
}))
      `
    ]);

    let output = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.on('close', (code) => {
      try {
        const result = JSON.parse(output.trim());
        console.log(`- Python version: ${result.python_version}`);

        let allInstalled = true;
        let missing = [];

        for (const [package, info] of Object.entries(result.packages)) {
          console.log(`- ${package}: ${info.installed ? `OK (${info.version})` : 'MISSING'}`);

          if (!info.installed) {
            allInstalled = false;
            missing.push(package);
          }
        }

        if (allInstalled) {
          resolve({
            status: 'ok',
            pythonVersion: result.python_version,
            packages: result.packages
          });
        } else {
          console.log(`- ERROR: Missing required Python packages: ${missing.join(', ')}`);
          resolve({
            status: 'error',
            pythonVersion: result.python_version,
            packages: result.packages,
            missing
          });
        }
      } catch (error) {
        console.log('- ERROR: Could not parse Python dependency information');
        resolve({
          status: 'error',
          message: `Failed to parse Python dependency info: ${error.message}`
        });
      }
    });
  });
}

// JS_FUNCTION::CHECK_NODE_DEPS
// Check Node.js dependencies
async function checkNodeDeps() {
  console.log('Checking Node.js dependencies...');

  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('- ERROR: package.json not found');
      return {
        status: 'error',
        message: 'package.json not found'
      };
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    const requiredDeps = packageJson.dependencies || {};
    const allDeps = Object.keys(requiredDeps);

    console.log(`- Found ${allDeps.length} required dependencies in package.json`);

    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
    const nodeModulesExists = fs.existsSync(nodeModulesPath);

    if (!nodeModulesExists) {
      console.log('- ERROR: node_modules directory not found');
      return {
        status: 'error',
        message: 'node_modules directory not found'
      };
    }

    // Check a few critical dependencies
    const criticalDeps = ['commander', 'chalk', 'js-yaml'];
    const missing = [];

    for (const dep of criticalDeps) {
      const depPath = path.join(nodeModulesPath, dep);
      if (!fs.existsSync(depPath)) {
        missing.push(dep);
      }
    }

    if (missing.length > 0) {
      console.log(`- ERROR: Missing critical dependencies: ${missing.join(', ')}`);
      return {
        status: 'error',
        missing
      };
    }

    console.log('- All critical Node.js dependencies found');
    return {
      status: 'ok',
      dependencies: allDeps.length
    };
  } catch (error) {
    console.log(`- ERROR: Failed to check Node.js dependencies: ${error.message}`);
    return {
      status: 'error',
      message: `Failed to check Node.js dependencies: ${error.message}`
    };
  }
}

// JS_FUNCTION::RUN_OVERALL_CHECK
// Run all health checks and return overall status
async function runHealthCheck() {
  console.log('Running health check...');
  console.log('====================');

  const dirCheck = await checkDirectories();
  const diskCheck = await checkDiskSpace();
  const gpuCheck = await checkGPU();
  const modelCheck = await checkModelCache();
  const pythonCheck = await checkPythonDeps();
  const nodeCheck = await checkNodeDeps();

  const results = {
    timestamp: new Date().toISOString(),
    directories: dirCheck,
    diskSpace: diskCheck,
    gpu: gpuCheck,
    modelCache: modelCheck,
    pythonDeps: pythonCheck,
    nodeDeps: nodeCheck
  };

  // Determine overall health
  const hasErrors = [diskCheck, gpuCheck, modelCheck, pythonCheck, nodeCheck]
    .some(check => check.status === 'error');

  const hasWarnings = [diskCheck, gpuCheck, modelCheck, pythonCheck, nodeCheck]
    .some(check => check.status === 'warning');

  if (hasErrors) {
    results.overall = 'error';
    results.message = 'Critical issues detected';
  } else if (hasWarnings) {
    results.overall = 'warning';
    results.message = 'Warning issues detected';
  } else {
    results.overall = 'ok';
    results.message = 'All systems operational';
  }

  console.log('====================');
  console.log(`Overall health status: ${results.overall.toUpperCase()} - ${results.message}`);

  return results;
}

// JS_FUNCTION::MAIN
// Main entry point
async function main() {
  try {
    const results = await runHealthCheck();

    // Write results to file
    const resultPath = path.join(__dirname, '..', 'health-check-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`Health check results saved to ${resultPath}`);

    // Exit with appropriate code
    if (results.overall === 'error') {
      process.exit(2);
    } else if (results.overall === 'warning') {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(3);
  }
}

// JS_ACTION::RUN_MAIN
// Run the main function if this is the main module
if (require.main === module) {
  main();
}

// JS_EXPORT::MODULE
// Export health check functions
module.exports = {
  runHealthCheck,
  checkDirectories,
  checkDiskSpace,
  checkGPU,
  checkModelCache,
  checkPythonDeps,
  checkNodeDeps
};
