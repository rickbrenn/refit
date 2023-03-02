import fs from 'fs';
import path from 'path';

const defaultConfig = {
	rootDir: '',
	packageDirs: ['packages/*', 'modules/*'],
	filterByPackages: [],
	sortAlphabetical: false,
	showAll: false,
	isMonorepo: false,
	verbose: false,
	isHoisted: false,
	updateTo: 'latest',
	filterByDepTypes: [],
	filterByUpdateTypes: [],
	concurrency: 8,
	filterByDeps: [],
};

const loadConfig = (configFile, overrides = {}) => {
	try {
		const configPath = path.resolve(configFile || '.refitrc.json');
		const configExists = fs.existsSync(configPath);

		const userConfig = configExists ? fs.readFileSync(configPath) : {};

		return Object.keys(defaultConfig).reduce((acc, cur) => {
			acc[cur] = overrides[cur] || userConfig[cur] || defaultConfig[cur];

			// convert single entry values to arrays
			if (Array.isArray(defaultConfig[cur]) && !Array.isArray(acc[cur])) {
				acc[cur] = [acc[cur]];
			}

			return acc;
		}, {});
	} catch (err) {
		console.error(err);
		return false;
	}
};

export { defaultConfig, loadConfig };
