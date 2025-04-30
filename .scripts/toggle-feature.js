#!/usr/bin/env node

// Script to toggle features in the XML config file

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const CONFIG_PATH = path.join(process.cwd(), '.config', 'dev-tools.config.xml');

// Helper function to parse XML
async function parseXmlConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.error('Config file not found:', CONFIG_PATH);
      process.exit(1);
    }

    const xml = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parser = new xml2js.Parser({ explicitArray: false });
    return await parser.parseStringPromise(xml);
  } catch (error) {
    console.error('Failed to parse config:', error);
    process.exit(1);
  }
}

// Helper function to save XML
async function saveXmlConfig(config) {
  try {
    const builder = new xml2js.Builder({ headless: true });
    const xml = builder.buildObject(config);
    fs.writeFileSync(CONFIG_PATH, xml);
    console.log('Configuration saved successfully.');
  } catch (error) {
    console.error('Failed to save config:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node toggle-feature.js <feature> <enabled>');
    console.log('Features: devDebt, maintenance, testing, retrospective');
    console.log('Enabled: true, false');
    process.exit(0);
  }

  const [feature, enabled] = args;
  const validFeatures = ['devDebt', 'maintenance', 'testing', 'retrospective'];

  if (!validFeatures.includes(feature)) {
    console.error(`Invalid feature: ${feature}`);
    console.error('Valid features are:', validFeatures.join(', '));
    process.exit(1);
  }

  const enabledValue = enabled.toLowerCase() === 'true';

  // Parse config
  const config = await parseXmlConfig();

  // Update config
  if (!config.config[feature]) {
    config.config[feature] = {};
  }

  config.config[feature].enabled = enabledValue.toString();

  // Save config
  await saveXmlConfig(config);

  console.log(`Feature '${feature}' is now ${enabledValue ? 'enabled' : 'disabled'}.`);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});