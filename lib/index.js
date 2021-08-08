const parseArgs = require('minimist');

const list = require('./list');
const update = require('./update');
const interactiveUpdate = require('./interactiveUpdate');
const { loadConfig } = require('./config');

/*
--config - specify .refitrc file location

list - list all packages

--filter=<outdated|wanted|all> - filter the list of packages

--dir - location of project

update - run update wizard

--interactive | -i - interactive updater

--clean | -c - remove the package-lock.json and node_modules when
updating

--skip-install | -s - skip the 'npm i' command and only update
the package.json file

--latest | -l - upgrade packages to latest instead of the
default wanted only
*/

async function run() {
	// parse argument options
	// TODO: sync command line args and config file
	const {
		_,
		config,
		filter,

		// directory
		dir,

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

		// monorepo
		m,

		// only display packages from a specific monorepo package
		packageDir,
		p,
	} = parseArgs(process.argv.slice(2));

	// load the app config object
	const appConfig = loadConfig(config, {
		directory: dir,
		skipInstall: s || skipInstall,
		filter,
		clean: c || clean,
		latest: l || latest,
		interactive: i || interactive,
		monorepo: m,
		packageDir: p || packageDir,
	});

	// first arg is the command
	const [command] = _;

	switch (command) {
		case 'list':
		default:
			list(appConfig);
			break;

		case 'outdated':
			list({ ...appConfig, filter: 'outdated' });
			break;

		case 'update':
			if (appConfig.interactive) {
				interactiveUpdate(appConfig);
			} else {
				update(appConfig);
			}
			break;
	}
}

module.exports = run;
