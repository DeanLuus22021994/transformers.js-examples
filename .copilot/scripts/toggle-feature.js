#!/usr/bin/env node

/**
 * Script to toggle features in the .copilot/config.json file
 */

const fs = require('fs');
const path = require('path');

// Get config path
const configPath = path.join(__dirname, '..', 'config.json');

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node toggle-feature.js <feature> [enabled]');
    console.log('Features: devDebt, maintenance, testing, retrospective');
    console.log('If enabled is not specified, it will toggle the current value');
    process.exit(0);
  }

  const feature = args[0];
  const enabledArg = args[1];

  const validFeatures = ['devDebt', 'maintenance', 'testing', 'retrospective'];

  if (!validFeatures.includes(feature)) {
    console.error(`Invalid feature: ${feature}`);
    console.error('Valid features are:', validFeatures.join(', '));
    process.exit(1);
  }

  // Read config
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    // Make sure section exists
    if (!config[feature]) {
      config[feature] = { enabled: false };
    }

    // Toggle or set value
    const currentValue = config[feature].enabled || false;
    const newValue = enabledArg !== undefined
      ? enabledArg.toLowerCase() === 'true'
      : !currentValue;

    config[feature].enabled = newValue;

    // Write updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, '\t'));

    console.log(`Feature '${feature}' is now ${newValue ? 'enabled' : 'disabled'}.`);
  } catch (error) {
    console.error('Error updating configuration:', error.message);
    process.exit(1);
  }
}

main();