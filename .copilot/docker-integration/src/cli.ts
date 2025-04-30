#!/usr/bin/env node

import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { DockerIntegrationManager } from './core/docker-integration-manager';
import { Logger } from './utils/logger';
import { ConfigManager } from './utils/config-manager';

// Initialize logger
const logger = Logger.getInstance();

async function main() {
  try {
    // Parse command line arguments
    const argv = yargs(hideBin(process.argv))
      .command('init', 'Initialize Docker integration system', {}, async () => {
        logger.info('CLI', 'Initializing Docker integration system');
        const manager = DockerIntegrationManager.getInstance();
        const success = await manager.initialize();

        if (success) {
          console.log('Docker integration system initialized successfully.');
        } else {
          console.error('Failed to initialize Docker integration system. Check logs for details.');
          process.exit(1);
        }
      })
      .command('shutdown', 'Shut down Docker integration system', {}, async () => {
        logger.info('CLI', 'Shutting down Docker integration system');
        const manager = DockerIntegrationManager.getInstance();
        const success = await manager.shutdown();

        if (success) {
          console.log('Docker integration system shut down successfully.');
        } else {
          console.error('Failed to shut down Docker integration system. Check logs for details.');
          process.exit(1);
        }
      })
      .command('status', 'Get Docker integration system status', {}, async () => {
        logger.info('CLI', 'Getting Docker integration system status');
        const manager = DockerIntegrationManager.getInstance();
        const status = await manager.getStatus();

        console.log('Docker Integration System Status:');
        console.log('===============================');
        console.log(`Session ID: ${status.sessionId}`);
        console.log(`Timestamp: ${status.timestamp}`);
        console.log(`Docker Connected: ${status.dockerConnected}`);
        console.log(`Swarm Active: ${status.isSwarmActive}`);

        if (status.swarmInfo) {
          console.log('\nSwarm Information:');
          console.log(`  Cluster ID: ${status.swarmInfo.Cluster?.ID || 'N/A'}`);
          console.log(`  Node ID: ${status.swarmInfo.NodeID || 'N/A'}`);
          console.log(`  Node Address: ${status.swarmInfo.NodeAddr || 'N/A'}`);
          console.log(`  Managers: ${status.swarmInfo.Managers || 0}`);
          console.log(`  Nodes: ${status.swarmInfo.Nodes || 0}`);
        }

        console.log('\nCache Health:');
        console.log(`  Status: ${status.cacheHealth.status}`);

        if (status.cacheHealth.status === 'healthy') {
          console.log(`  Created: ${status.cacheHealth.created}`);
          console.log(`  Last Accessed: ${status.cacheHealth.lastAccessed}`);
          console.log(`  Model Count: ${status.cacheHealth.modelCount}`);
          console.log(`  Docker Layer Count: ${status.cacheHealth.dockerLayerCount}`);
          console.log(`  Model Cache Size: ${status.cacheHealth.modelCacheSize}`);
          console.log(`  Docker Layer Cache Size: ${status.cacheHealth.dockerLayerCacheSize}`);
          console.log(`  Total Cache Size: ${status.cacheHealth.totalCacheSize}`);
        } else {
          console.log(`  Message: ${status.cacheHealth.message}`);
        }

        console.log('\nTerminal Hooks:');
        console.log(`  Installed: ${status.hooks.installed}`);
        console.log(`  Shell Type: ${status.hooks.shellType}`);
        console.log(`  Hook Script Path: ${status.hooks.hookScriptPath}`);
      })
      .command('config', 'Manage Docker integration system configuration', (yargs) => {
        return yargs
          .command('get [key]', 'Get configuration value', {
            key: {
              describe: 'Configuration key (dot notation)',
              type: 'string'
            }
          }, (argv) => {
            const configManager = ConfigManager.getInstance(logger);

            if (argv.key) {
              const value = configManager.get(argv.key, undefined);
              if (value !== undefined) {
                console.log(`${argv.key}: ${JSON.stringify(value, null, 2)}`);
              } else {
                console.error(`Configuration key '${argv.key}' not found.`);
              }
            } else {
              console.log(JSON.stringify(configManager.getAll(), null, 2));
            }
          })
          .command('set <key> <value>', 'Set configuration value', {
            key: {
              describe: 'Configuration key (dot notation)',
              type: 'string',
              demandOption: true
            },
            value: {
              describe: 'Configuration value',
              type: 'string',
              demandOption: true
            }
          }, (argv) => {
            const configManager = ConfigManager.getInstance(logger);

            try {
              // Parse value based on type
              let parsedValue: any = argv.value;

              if (parsedValue === 'true' || parsedValue === 'false') {
                parsedValue = parsedValue === 'true';
              } else if (!isNaN(Number(parsedValue))) {
                parsedValue = Number(parsedValue);
              } else if (parsedValue === 'null') {
                parsedValue = null;
              } else if (parsedValue === 'undefined') {
                parsedValue = undefined;
              } else {
                try {
                  // Try to parse as JSON
                  parsedValue = JSON.parse(parsedValue);
                } catch {
                  // Leave as string if not valid JSON
                }
              }

              configManager.set(argv.key, parsedValue);
              console.log(`Configuration key '${argv.key}' set to '${JSON.stringify(parsedValue)}'.`);
            } catch (error) {
              console.error(`Error setting configuration: ${error instanceof Error ? error.message : String(error)}`);
            }
          })
          .command('reset', 'Reset configuration to defaults', {}, () => {
            const configManager = ConfigManager.getInstance(logger);
            configManager.resetToDefaults();
            console.log('Configuration reset to defaults.');
          })
          .demandCommand(1, 'You must specify a command')
          .help();
      })
      .command('swarm', 'Manage Docker Swarm', (yargs) => {
        return yargs
          .command('init', 'Initialize Docker Swarm', {}, async () => {
            logger.info('CLI', 'Initializing Docker Swarm');
            const manager = DockerIntegrationManager.getInstance();
            await manager.initialize();
          })
          .command('teardown', 'Tear down Docker Swarm', {}, async () => {
            logger.info('CLI', 'Tearing down Docker Swarm');
            const manager = DockerIntegrationManager.getInstance();
            await manager.shutdown();
          })
          .demandCommand(1, 'You must specify a command')
          .help();
      })
      .command('cache', 'Manage Docker cache', (yargs) => {
        return yargs
          .command('setup', 'Set up Docker caching', {}, async () => {
            logger.info('CLI', 'Setting up Docker caching');
            const manager = DockerIntegrationManager.getInstance();
            await manager.initialize();
          })
          .command('status', 'Get cache status', {}, async () => {
            logger.info('CLI', 'Getting cache status');
            const manager = DockerIntegrationManager.getInstance();
            const status = await manager.getStatus();

            console.log('Cache Status:');
            console.log('============');
            console.log(`Status: ${status.cacheHealth.status}`);

            if (status.cacheHealth.status === 'healthy') {
              console.log(`Created: ${status.cacheHealth.created}`);
              console.log(`Last Accessed: ${status.cacheHealth.lastAccessed}`);
              console.log(`Model Count: ${status.cacheHealth.modelCount}`);
              console.log(`Docker Layer Count: ${status.cacheHealth.dockerLayerCount}`);
              console.log(`Model Cache Size: ${status.cacheHealth.modelCacheSize}`);
              console.log(`Docker Layer Cache Size: ${status.cacheHealth.dockerLayerCacheSize}`);
              console.log(`Total Cache Size: ${status.cacheHealth.totalCacheSize}`);
            } else {
              console.log(`Message: ${status.cacheHealth.message}`);
            }
          })
          .demandCommand(1, 'You must specify a command')
          .help();
      })
      .command('hooks', 'Manage terminal hooks', (yargs) => {
        return yargs
          .command('install', 'Install terminal hooks', {}, async () => {
            logger.info('CLI', 'Installing terminal hooks');
            const manager = DockerIntegrationManager.getInstance();
            await manager.initialize();
          })
          .command('uninstall', 'Uninstall terminal hooks', {}, async () => {
            logger.info('CLI', 'Uninstalling terminal hooks');
            const manager = DockerIntegrationManager.getInstance();
            await manager.shutdown();
          })
          .command('status', 'Get hook status', {}, async () => {
            logger.info('CLI', 'Getting hook status');
            const manager = DockerIntegrationManager.getInstance();
            const status = await manager.getStatus();

            console.log('Terminal Hooks Status:');
            console.log('=====================');
            console.log(`Installed: ${status.hooks.installed}`);
            console.log(`Shell Type: ${status.hooks.shellType}`);
            console.log(`Hook Script Path: ${status.hooks.hookScriptPath}`);
            console.log('Hook Files:');
            status.hooks.hookFiles.forEach((file: string) => {
              console.log(`  - ${file}`);
            });
          })
          .demandCommand(1, 'You must specify a command')
          .help();
      })
      .demandCommand(1, 'You must specify a command')
      .strict()
      .help()
      .argv;
  } catch (error) {
    logger.error('CLI', `Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  logger.error('CLI', `Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
  console.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
