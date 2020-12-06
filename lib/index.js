const fs = require('fs');
const path = require('path');
const parseArgs = require('minimist');
const chalk = require('chalk');

const list = require('./list');
const update = require('./update');
const interactiveUpdate = require('./interactiveUpdate');

/*
--config - specify .refitrc file location

list - list all packages

--filter=<outdated|wanted> - filter the list of packages

update - run update wizard

--interactive | -i - interactive updater

--clean | -c - remove the package-lock.json and node_modules when
updating

--skip-install | -s - skip the 'npm i' command and only update
the package.json file

--latest | -l - upgrade packages to latest instead of the
default wanted only

*/

function loadConfig(configArg) {
	const config = {
		packageJsonPath: 'package.json',
		packageLockPath: 'package-lock.json',
		packageTypes: ['dependencies', 'devDependencies'],
	};

	const configPath = path.resolve(configArg || '.refitrc.json');

	try {
		const configExists = fs.existsSync(configPath);

		// notify the user of a bad config argument
		if (configArg && !configExists) {
			console.log(
				chalk.red(
					'Config not found in specified location, using defaults.'
				)
			);
		}

		const userConfig = configExists ? require(configPath) : {};

		Object.keys(config).forEach((key) => {
			if (Object.prototype.hasOwnProperty.call(userConfig, key)) {
				config[key] = userConfig[key];
			}
		});
	} catch (err) {
		console.error(err);
	}

	return config;
}

async function run() {
	// parse argument options
	const {
		_,
		config: configArg,
		filter,

		// clean
		c,
		clean,

		// skip install
		s,
		'skip-install': skipInstall,

		// upgrade to latest
		l,
		latest,

		// interactive update
		i,
		interactive,
	} = parseArgs(process.argv.slice(2));

	// load the app config object
	const config = loadConfig(configArg);

	switch (_[0]) {
		case 'list':
			list(config, { filter });
			break;

		case 'outdated':
			list(config, { filter: 'outdated' });
			break;

		case 'update':
			if (i || interactive) {
				interactiveUpdate(config);
			} else {
				update(config, {
					clean: clean || c,
					skipInstall: skipInstall || s,
					latest: latest || l,
				});
			}
			break;

		default:
			list(config, { filter });
			break;
	}
}

module.exports = run;
