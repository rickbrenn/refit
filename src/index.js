import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
	withConfig,
	// getConfigFile,
	getGlobalOptions,
	getCommandOptions,
	cliCommands,
} from './config';
import log from './logger';

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
