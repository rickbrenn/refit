import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

const defaultConfig = {
	directory: './',
	packageJsonPath: 'package.json',
	packageLockPath: 'package-lock.json',
	dependencyTypes: ['dependencies', 'devDependencies'],
	skipInstall: true,
	filter: 'all',
	clean: false,
	latest: false,
	interactive: false,

	// monorepo config
	monorepo: false,
	allColumns: false,
	// TODO: update default value
	packageDirs: ['./packages', './modules'],
	hoisted: true,
	packageDir: '',
};

function loadConfig(configFile, overrides = {}) {
	try {
		const configPath = path.resolve(configFile || '.refitrc.json');
		const configExists = fs.existsSync(configPath);

		// notify the user of a bad config argument
		if (configFile && !configExists) {
			console.log(chalk.red('Config not found in specified location.'));
		}

		const config = {};
		const userConfig = configExists ? fs.readFileSync(configPath) : {};

		Object.keys(defaultConfig).forEach((key) => {
			config[key] =
				overrides[key] || userConfig[key] || defaultConfig[key];
		});

		return config;
	} catch (err) {
		console.error(err);
	}
}

export { defaultConfig, loadConfig };
