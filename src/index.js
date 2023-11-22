import React from 'react';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { render } from 'ink';
import List from './commands/List';
import Update from './commands/Update';
import InteractiveUpdate from './commands/InteractiveUpdate';
import Wizard from './commands/Wizard';
import {
	withConfig,
	// getConfigFile,
	getGlobalOptions,
	getCommandOptions,
} from './config';
import log from './logger';

const listCommand = ({ appConfig }) => {
	render(<List config={appConfig} />);
};

const updateCommand = ({ appConfig }) => {
	const Command = appConfig.interactive ? InteractiveUpdate : Update;
	render(<Command config={appConfig} />);
};

const WizardCommand = ({ appConfig }) => {
	render(<Wizard config={appConfig} />);
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
		id: 'wizard',
		yargsConfig: {
			command: 'wizard',
			aliases: ['w'],
			desc: 'interactively add and update dependencies',
			handler: WizardCommand,
		},
	},
];

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
