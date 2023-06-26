import fs from 'fs';
import path from 'path';

const defaultConfig = {
	rootPath: '',
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
	const configPath = path.resolve(configFile || '.refitrc.json');
	const configExists = fs.existsSync(configPath);

	const userConfig = configExists ? fs.readFileSync(configPath) : {};

	return Object.keys(defaultConfig).reduce((acc, cur) => {
		const val = overrides[cur] || userConfig[cur] || defaultConfig[cur];

		acc[cur] = val;

		// convert single entry values to arrays
		if (Array.isArray(defaultConfig[cur]) && !Array.isArray(val)) {
			acc[cur] = [val];
		}

		// convert rootPath to absolute path
		if (cur === 'rootPath') {
			acc[cur] = val ? path.resolve(val) : process.cwd();
		}

		return acc;
	}, {});
};
export { defaultConfig, loadConfig };
