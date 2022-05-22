import React from 'react';
import parseArgs from 'minimist';
import { render } from 'ink';

import List from './commands/list/List.js';
import { loadConfig } from './config.js';

/*
--config - specify .refitrc file location

list - list all dependencies

--filter=<outdated|wanted|all> - filter the list of dependencies

--dir - location of project

--allColumns - shows all columns

update - run update wizard

--interactive | -i - interactive updater

--clean | -c - remove the package-lock.json and node_modules when
updating

--skip-install | -s - skip the 'npm i' command and only update
the package.json file

--latest | -l - upgrade dependencies to latest instead of the
default wanted only
*/

async function run() {
	// parse argument options
	// TODO: sync command line args and config file
	const {
		_,
		config,
		filter,
		sort,

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

		// list all table columns
		allColumns,

		// only display dependencies from a specific monorepo package
		packageDir,
		p,
	} = parseArgs(process.argv.slice(2));

	// load the app config object
	const appConfig = loadConfig(config, {
		directory: dir,
		skipInstall: s || skipInstall,
		filter,
		sort,
		clean: c || clean,
		latest: l || latest,
		interactive: i || interactive,
		monorepo: m,
		allColumns,
		packageDir: p || packageDir,
	});

	// first arg is the command
	const [command] = _;

	switch (command) {
		case 'list':
			render(<List config={appConfig} />);
			break;

		case 'outdated':
		default:
			render(
				<List
					config={{
						...appConfig,
						filter: 'outdated',
						sort: 'update',
					}}
				/>
			);
			break;
	}
}

export default run;
