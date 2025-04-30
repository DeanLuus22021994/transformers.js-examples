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
		const result = shellIntegration.executeCommand(argv.command, argv.directory || process.cwd());
		console.log(result.output);
		process.exit(result.exitCode);
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
			const data = archiveUtility.extractArchive(argv.archiveName);

			if (argv.output) {
				fs.writeFileSync(argv.output, JSON.stringify(data, null, 2));
				console.log(`Archive extracted to ${argv.output}`);
			} else {
				console.log(JSON.stringify(data, null, 2));
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