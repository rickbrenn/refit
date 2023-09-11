import fs from 'fs';
import path from 'path';

const configOptions = [
	{
		name: 'all',
		options: {
			alias: 'a',
			describe: 'show all dependencies including up to date ones',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['list'],
		inUserConfig: false,
	},
	{
		name: 'concurrency',
		options: {
			alias: 'c',
			describe: '',
			type: 'number',
			default: 8,
		},
		yargsType: 'global',
		yargsCommmands: [],
		inUserConfig: true,
	},
	{
		name: 'dependencies',
		options: {
			describe: 'dependencies to update',
			type: 'array',
			default: [],
		},
		yargsType: 'positional',
		yargsCommmands: ['update'],
		inUserConfig: false,
	},
	{
		name: 'deprecated',
		options: {
			describe: 'allow updating to deprecated versions',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update'],
		inUserConfig: false,
	},
	{
		name: 'depTypes',
		options: {
			alias: 'd',
			describe: 'filter by dependency type',
			type: 'array',
			default: [],
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update', 'interactive'],
		inUserConfig: false,
	},
	{
		name: 'hoisted',
		options: {
			alias: 'h',
			describe: 'check for hoisted node modules',
			type: 'boolean',
			default: false,
		},
		yargsType: 'global',
		yargsCommmands: [],
		inUserConfig: true,
	},
	{
		name: 'monorepo',
		options: {
			alias: 'm',
			describe: 'specify if the package is a monorepo',
			type: 'boolean',
			default: false,
		},
		yargsType: 'global',
		yargsCommmands: [],
		inUserConfig: true,
	},
	{
		name: 'noIssues',
		options: {
			alias: 'n',
			describe: 'hide issues section from list output',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['list'],
		inUserConfig: false,
	},
	{
		name: 'packageDirs',
		options: {
			alias: 'P',
			describe: 'directories of the monorepo packages',
			type: 'array',
			default: ['packages/*', 'modules/*'],
		},
		yargsType: 'global',
		yargsCommmands: [],
		inUserConfig: true,
	},
	{
		name: 'packageManager',
		options: {
			describe: 'package manager to use',
			type: 'string',
			default: () => {
				const packageManagers = [
					{
						name: 'npm',
						lockFile: 'package-lock.json',
					},
					{
						name: 'yarn',
						lockFile: 'yarn.lock',
					},
				];

				const packageManager = packageManagers.find(({ lockFile }) => {
					return fs.existsSync(path.resolve(lockFile));
				});

				return packageManager.name || 'npm';
			},
			choices: ['npm', 'yarn'],
		},
		yargsType: 'global',
		yargsCommmands: [],
		inUserConfig: true,
	},
	{
		name: 'prerelease',
		options: {
			describe: 'allow updating to prerelease versions',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update'],
		inUserConfig: false,
	},
	{
		name: 'packages',
		options: {
			alias: 'p',
			describe: 'filter by package name',
			type: 'array',
			default: [],
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update', 'interactive'],
		inUserConfig: false,
	},
	{
		name: 'sort',
		options: {
			alias: 's',
			describe: 'sort dependencies',
			type: 'string',
			default: 'type',
			choices: ['name', 'date', 'type'],
		},
		yargsType: 'command',
		yargsCommmands: ['list'],
		inUserConfig: false,
	},
	{
		name: 'updateTo',
		options: {
			alias: 't',
			describe: 'update dependencies to semver type',
			type: 'string',
			default: 'latest',
			choices: ['latest', 'wanted', 'target'],
		},
		yargsType: 'command',
		yargsCommmands: ['update'],
		inUserConfig: false,
	},
	{
		name: 'updateTypes',
		options: {
			alias: 'u',
			describe: 'filter by update type',
			type: 'array',
			default: [],
			choices: ['major', 'minor', 'patch'],
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update'],
		inUserConfig: false,
	},
	{
		name: 'verbose',
		options: {
			alias: 'v',
			describe: 'display all columns of dependency information',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['list'],
		inUserConfig: false,
	},
];

const getGlobalOptions = () => {
	return configOptions.reduce((acc, cur) => {
		if (cur.yargsType === 'global') {
			acc[cur.name] = cur.options;
		}
		return acc;
	}, {});
};

const getCommandOptions = (commandId) => {
	return configOptions.reduce(
		(acc, cur) => {
			if (cur.yargsCommmands.includes(commandId)) {
				if (cur.yargsType === 'command') {
					acc.options[cur.name] = cur.options;
				}

				if (cur.yargsType === 'positional') {
					acc.positional.push(cur.name, cur.options);
				}
			}

			return acc;
		},
		{ options: {}, positional: [] }
	);
};

const loadConfig = ({ config, ...overrides } = {}) => {
	const configPath = path.resolve(config || '.refitrc.json');
	const configExists = fs.existsSync(configPath);

	const userConfig = configExists ? fs.readFileSync(configPath) : {};

	const baseConfig = {
		rootPath: process.cwd(),
	};

	return configOptions.reduce((acc, cur) => {
		const {
			name,
			options: { default: defaultVal },
			inUserConfig,
		} = cur;

		// set initial value to the default
		let val = typeof defaultVal === 'function' ? defaultVal() : defaultVal;

		// user value or default if nullish
		if (inUserConfig) {
			val = userConfig[name] ?? val;
		}

		// override value or user/default if nullish
		val = overrides[name] ?? val;

		// convert single entry values to arrays
		if (Array.isArray(defaultVal) && !Array.isArray(val)) {
			val = [val];
		}

		acc[name] = val;
		return acc;
	}, baseConfig);
};
export { configOptions, loadConfig, getGlobalOptions, getCommandOptions };
