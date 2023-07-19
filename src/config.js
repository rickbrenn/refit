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
			alias: 'C',
			describe: '',
			type: 'number',
			default: 8,
		},
		yargsType: 'global',
		yargsCommmands: [],
		inUserConfig: true,
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
	return configOptions.reduce((acc, cur) => {
		if (cur.yargsCommmands.includes(commandId)) {
			acc[cur.name] = cur.options;
		}
		return acc;
	}, {});
};

const loadConfig = ({ config, ...overrides } = {}) => {
	const configPath = path.resolve(config || '.refitrc.json');
	const configExists = fs.existsSync(configPath);

	const userConfig = configExists ? fs.readFileSync(configPath) : {};

	const baseConfig = {
		rootPath: process.cwd(),
	};

	return configOptions.reduce((acc, cur) => {
		const { name, options, inUserConfig } = cur;

		// set initial value to the default
		let val = options.default;

		// user value or default if nullish
		if (inUserConfig) {
			val = userConfig[name] ?? val;
		}

		// override value or user/default if nullish
		val = overrides[name] ?? val;

		// convert single entry values to arrays
		if (Array.isArray(options.default) && !Array.isArray(val)) {
			val = [val];
		}

		acc[name] = val;
		return acc;
	}, baseConfig);
};
export { configOptions, loadConfig, getGlobalOptions, getCommandOptions };
