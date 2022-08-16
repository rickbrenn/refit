import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const defaultConfig = {
	rootDir: '',
	dependencyTypes: [],
	packageDirs: ['packages/*', 'modules/*'],
	filterByPackages: [],
	sortAlphabetical: false,
	showAll: false,
	isMonorepo: false,
	verbose: false,
	isHoisted: false,
	updateTo: 'latest',
	concurrency: 8,
};

const loadConfig = (configFile, overrides = {}) => {
	try {
		const configPath = path.resolve(configFile || '.refitrc.json');
		const configExists = fs.existsSync(configPath);

		// notify the user of a bad config argument
		if (configFile && !configExists) {
			console.log(chalk.red('Config not found in specified location.'));
		}

		const userConfig = configExists ? fs.readFileSync(configPath) : {};

		return Object.keys(defaultConfig).reduce((acc, cur) => {
			acc[cur] = overrides[cur] || userConfig[cur] || defaultConfig[cur];
			return acc;
		}, {});
	} catch (err) {
		console.error(err);
		return false;
	}
};

export { defaultConfig, loadConfig };
