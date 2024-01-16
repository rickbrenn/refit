import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
	withConfig,
	getGlobalOptions,
	getCommandOptions,
	cliCommands,
	// configOptions,
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

// for generating command options table
// const run = async () => {
// 	const command = 'changes';
// 	const tableRows = [];

// 	const headers = ['Option', 'Type [choices]', 'Default', 'Description'];
// 	tableRows.push(headers);

// 	// opt.yargsCommmands.length === 0

// 	for (const opt of configOptions) {
// 		if (
// 			opt.yargsType !== 'positional' &&
// 			opt.yargsCommmands.includes(command)
// 		) {
// 			const row = [
// 				`\`--${opt.name}\` ${
// 					opt.options.alias ? `, \`-${opt.options.alias}\`` : ''
// 				}`,
// 				`${opt.options.type} ${
// 					opt.options.choices
// 						? `[${opt.options.choices
// 								.map((c) => `\`${c}\``)
// 								.join(', ')}]`
// 						: ''
// 				}`,
// 				opt.options.default,
// 				opt.options.describe,
// 			];

// 			tableRows.push(row);
// 		}
// 	}

// 	for (const [i, tableRow] of tableRows.entries()) {
// 		tableRows[i] = tableRow.join(' | ');
// 	}

// 	console.log(tableRows.join('\n'));
// };

export default run;
