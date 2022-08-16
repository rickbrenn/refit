import React from 'react';
import parseArgs from 'minimist';
import { render } from 'ink';

import List from './commands/list/List.js';
// import Update from './commands/update/Update.js';
import { loadConfig } from './config.js';

const run = async () => {
	// parse argument options
	const {
		_: [command],

		// show all dependencies including up to date ones
		a,
		all,

		// sort dependencies alphabetically
		A,
		alpha,

		// .refitrc file path
		c,
		config,

		// check for hoisted node modules
		h,
		hoisted,

		// specify if the package is a monorepo
		m,
		monorepo,

		// filter by package
		p,
		package: filterByPackages,

		// root directory of the monorepo
		r,
		rootDir,

		// update dependencies to semver type
		t,
		to,

		// show all columns of dependency information
		v,
		verbose,
	} = parseArgs(process.argv.slice(2));

	// load the app config object
	const appConfig = loadConfig(c || config, {
		rootDir: r || rootDir,
		filterByPackages: p || filterByPackages,
		isMonorepo: m || monorepo,
		isHoisted: h || hoisted,
		config: c || config,
		sortAlphabetical: A || alpha,
		showAll: a || all,
		updateTo: t || to,
		verbose: v || verbose,
	});

	switch (command) {
		case 'update':
			// render(<Update config={appConfig} />);
			break;

		case 'list':
		default:
			render(<List config={appConfig} />);
			break;
	}
};

export default run;
