import React from 'react';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { render } from 'ink';
import List from './commands/List';
import Update from './commands/Update';
import Interactive from './commands/Interactive';
import { loadConfig, getGlobalOptions, getCommandOptions } from './config';
import log from './logger';

const listCommand = ({ appConfig }) => {
	render(<List config={appConfig} />);
};

const updateCommand = ({ appConfig }) => {
	render(<Update config={appConfig} />);
};

const interactiveCommand = ({ appConfig }) => {
	render(<Interactive config={appConfig} />);
};

const cliCommands = [
	{
		id: 'list',
		yargsConfig: {
			command: '*',
			aliases: ['ls'],
			desc: 'list all dependencies',
			handler: listCommand,
		},
	},
	{
		id: 'update',
		yargsConfig: {
			command: 'update [dependencies..]',
			aliases: ['up'],
			desc: 'update dependencies',
			handler: updateCommand,
		},
	},
	{
		id: 'interactive',
		yargsConfig: {
			command: 'interactive',
			aliases: ['i'],
			desc: 'interactively update dependencies',
			handler: interactiveCommand,
		},
	},
];

const withConfig = (argv) => {
	// load the app config object
	const appConfig = loadConfig(argv);

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

	for (const command of cliCommands) {
		const commandOptions = getCommandOptions(command.id);

		cli.command({
			...command.yargsConfig,
			builder: (yargsInstance) => {
				if (commandOptions.positional.length) {
					yargsInstance.positional(...commandOptions.positional);
				}

				yargsInstance.options(commandOptions.options);
			},
		});
	}

	const globalOptions = getGlobalOptions();
	cli.options(globalOptions);

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
