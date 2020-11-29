const fs = require('fs');
const path = require('path');
const parseArgs = require('minimist');
const chalk = require('chalk');

const list = require('./list');
const update = require('./update');

/*
list - list all packages
update - run update wizard

--config - specify .refitrc file location

--filter=<outdated|wanted> - filter the list of packages

--clean | -c - remove the package-lock.json and node_modules when
updating

--skip-install | -s - skip the 'npm i' command and only update
the package.json file

--latest | -l - upgrade packages to latest instead of the
default wanted only

*/

function loadConfig(configArg) {
	let config = {
		packageJsonPath: './package.json',
		packageLockPath: './package-lock.json',
		packageTypes: ['dependencies', 'devDependencies'],
	};

	const configPath = configArg || './.refitrc.json';
	const configPathFull = path.join(__dirname, configPath);

	try {
		const configExists = fs.existsSync(configPathFull);

		if (configExists) {
			const configFile = require(configPathFull);
			config = {
				...config,
				...configFile,
			};
		}

		// notify the user of a bad config argument
		if (configArg && !configExists) {
			console.log(
				chalk.red(
					'Config not found in specified location, using defaults.'
				)
			);
		}
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
			update(config, {
				clean: clean || c,
				skipInstall: skipInstall || s,
				latest: latest || l,
			});
			break;

		default:
			list(config, { filter });
			break;
	}
}

module.exports = run;
