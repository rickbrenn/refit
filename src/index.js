import React from 'react';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { render } from 'ink';
import List from './commands/List';
import Update from './commands/Update';
import Interactive from './commands/Interactive';
import { loadConfig } from './config';
import log from './logger';

const listCommand = async ({ appConfig }) => {
	render(<List config={appConfig} />);
};

const updateCommand = ({ appConfig }) => {
	render(<Update config={appConfig} />);
};

const interactiveCommand = ({ appConfig }) => {
	render(<Interactive config={appConfig} />);
};

const cliConfig = {
	globalOptions: {
		config: {
			alias: 'c',
			describe: '.refitrc file path',
			type: 'string',
			default: '.refitrc.json',
		},
		rootDir: {
			alias: 'r',
			describe: 'root directory of the package/repository',
			type: 'string',
			default: '',
		},
	},
	commands: [
		{
			command: '*',
			aliases: ['ls'],
			desc: 'list all dependencies',
			options: {
				all: {
					alias: 'a',
					describe: 'show all dependencies including up to date ones',
					type: 'boolean',
					default: false,
				},
				alpha: {
					alias: 'A',
					describe: 'sort dependencies alphabetically',
					type: 'boolean',
					default: false,
				},
				depTypes: {
					alias: 'd',
					describe: 'filter by dependency type',
					type: 'array',
					default: [],
				},
				hoisted: {
					alias: 'h',
					describe: 'check for hoisted node modules',
					type: 'boolean',
					default: false,
				},
				monorepo: {
					alias: 'm',
					describe: 'specify if the package is a monorepo',
					type: 'boolean',
					default: false,
				},
				packages: {
					alias: 'p',
					describe: 'filter by package name',
					type: 'array',
					default: [],
				},
				updateTypes: {
					alias: 'u',
					describe: 'filter by update type',
					type: 'array',
					default: [],
					choices: ['major', 'minor', 'patch'],
				},
				verbose: {
					alias: 'v',
					describe: 'display all columns of dependency information',
					type: 'boolean',
					default: false,
				},
			},
			handler: listCommand,
		},
		{
			command: 'update',
			aliases: ['up'],
			desc: 'update dependencies',
			options: {
				to: {
					alias: 't',
					describe: 'update dependencies to semver type',
					type: 'string',
					default: 'latest',
					choices: ['latest', 'wanted', 'target'],
				},
			},
			positional: {
				key: 'dependencies',
				options: {
					describe: 'dependencies to update',
					type: 'array',
					default: [],
				},
			},
			handler: updateCommand,
		},
		{
			command: 'interactive',
			aliases: ['i'],
			desc: 'interactively update dependencies',
			options: {
				hoisted: {
					alias: 'h',
					describe: 'check for hoisted node modules',
					type: 'boolean',
					default: false,
				},
				monorepo: {
					alias: 'm',
					describe: 'specify if the package is a monorepo',
					type: 'boolean',
					default: false,
				},
			},
			handler: interactiveCommand,
		},
	],
};

const withConfig = (argv) => {
	// load the app config object
	const appConfig = loadConfig(argv.config, {
		rootDir: argv.rootDir,
		filterByPackages: argv.packages,
		isMonorepo: argv.monorepo,
		isHoisted: argv.hoisted,
		sortAlphabetical: argv.alpha,
		showAll: argv.all,
		updateTo: argv.to,
		filterByDepTypes: argv.depTypes,
		filterByUpdateTypes: argv.updateTypes,
		verbose: argv.verbose,
		filterByDeps: argv.dependencies,
	});

	// eslint-disable-next-line no-param-reassign
	argv.appConfig = appConfig;
};

const createCli = async (argv) => {
	const cli = yargs(argv)
		.middleware([withConfig])
		.strict()
		.help()
		.showHelpOnFail(false)
		.fail((msg, error) => {
			// if there's a yargs error handle it higher up
			throw error || new Error(msg);
		})
		.scriptName('refit');

	for (const command of cliConfig.commands) {
		cli.command({
			...command,
			builder: (yargsInstance) => {
				if (command.positional) {
					yargsInstance.positional(
						command.positional.key,
						command.positional.options
					);
				}

				if (command.options) {
					yargsInstance.options(command.options);
				}
			},
		});
	}

	cli.options(cliConfig.globalOptions);

	return cli.parseAsync(argv);
};

const run = () => {
	const argv = hideBin(process.argv);
	createCli(argv).catch((error) => {
		log.error(error.message);
		process.exitCode = 1;
	});
};

export default run;
