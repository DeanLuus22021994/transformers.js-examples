#!/usr/bin/env node

/**
 * Script to ensure required directories exist
 */

const fs = require('fs');
const path = require('path');

// Directories to ensure
const dirs = [
  '../templates/dev-debt',
  '../../.dev-debt-logs',
  '../../reports/retrospectives',
  '../../reports/dev-debt'
];

// Main function
function main() {
  const basePath = path.join(__dirname);

  dirs.forEach(dir => {
    const fullPath = path.resolve(path.join(basePath, dir));

    if (!fs.existsSync(fullPath)) {
      try {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created directory: ${fullPath}`);
      } catch (error) {
        console.error(`Failed to create directory ${fullPath}:`, error.message);
      }
    } else {
      console.log(`Directory exists: ${fullPath}`);
    }
  });
}

main();