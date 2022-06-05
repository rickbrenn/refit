import React from 'react';
import parseArgs from 'minimist';
import { render } from 'ink';

import List from './commands/list/List.js';
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
		package: usePackages,

		// root directory of the monorepo
		r,
		rootDir,

		// show all columns of dependency information
		v,
		verbose,
	} = parseArgs(process.argv.slice(2));

	// load the app config object
	const appConfig = loadConfig(c || config, {
		rootDir: r || rootDir,
		usePackages: p || usePackages,
		monorepo: m || monorepo,
		hoisted: h || hoisted,
		config: c || config,
		sortAlphabetical: A || alpha,
		showAll: a || all,
		verbose: v || verbose,
	});

	switch (command) {
		case 'list':
		default:
			render(<List config={appConfig} />);
			break;
	}
};

export default run;
