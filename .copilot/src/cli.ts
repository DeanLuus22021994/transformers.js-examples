#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { ShellIntegration } from './shell-integration';
import { ArchiveUtility } from './tracer/archive-utility';
import fs from 'fs';

const baseDir = path.resolve(__dirname, '..');
const shellIntegration = new ShellIntegration(baseDir);
const archiveUtility = new ArchiveUtility(path.join(baseDir, 'trace'));

// Configure and parse CLI arguments
yargs(hideBin(process.argv))
	.command('execute <command>', 'Execute a command with tracing', (yargs) => {
		return yargs
			.positional('command', {
				describe: 'Command to execute',
				type: 'string',
			})
			.option('directory', {
				alias: 'd',
				describe: 'Directory to execute command in',
				type: 'string',
			});
	}, (argv) => {
		// Fix for string | undefined error on line 29
		const directory = argv.directory || process.cwd();
		// Fix the command parameter to ensure it's always a string
		if (typeof argv.command === 'string') {
			const result = shellIntegration.executeCommand(argv.command, directory);
			console.log(result.output);
			process.exit(result.exitCode);
		} else {
			console.error('Error: Command is required');
			process.exit(1);
		}
	})

	.command('archive', 'Archive current terminal session', {}, (argv) => {
		const archivePath = shellIntegration.archiveSession();
		console.log(`Session archived to ${archivePath}`);
	})

	.command('list-archives', 'List all available archives', {}, (argv) => {
		const archives = archiveUtility.listArchives();
		console.table(archives.map(a => ({
			name: a.name,
			size: `${(a.size / 1024).toFixed(2)} KB`,
			date: a.date.toISOString()
		})));
	})

	.command('extract <archiveName>', 'Extract data from an archive', (yargs) => {
		return yargs
			.positional('archiveName', {
				describe: 'Name of the archive to extract',
				type: 'string',
			})
			.option('output', {
				alias: 'o',
				describe: 'Output file path',
				type: 'string',
			});
	}, (argv) => {
		try {
			// Fix the archiveName parameter to ensure it's always a string
			if (typeof argv.archiveName === 'string') {
				const data = archiveUtility.extractArchive(argv.archiveName);

				// Fix for string | undefined error on line 61
				const outputPath = argv.output || '';

				if (outputPath) {
					fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
					console.log(`Archive extracted to ${outputPath}`);
				} else {
					console.log(JSON.stringify(data, null, 2));
				}
			} else {
				console.error('Error: Archive name is required');
				process.exit(1);
			}
		} catch (error) {
			console.error(`Error extracting archive: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	})

	.command('clean', 'Clean old archives', (yargs) => {
		return yargs
			.option('days', {
				describe: 'Delete archives older than this many days',
				type: 'number',
				default: 30
			});
	}, (argv) => {
		const deletedFiles = archiveUtility.purgeOldArchives(argv.days);
		console.log(`Cleaned ${deletedFiles.length} old archives`);
		if (deletedFiles.length > 0) {
			console.log('Deleted files:');
			console.log(deletedFiles.join('\n'));
		}
	})

	.demandCommand(1, 'You need to specify a command')
	.help()
	.argv;