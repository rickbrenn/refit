import React from 'react';
import { render } from 'ink';
import packageManagers, { getPackageManager } from './common/packageManagers';
import { readJsonFile } from './common/filesystem';
import List from './commands/List';
import Update from './commands/Update';
import InteractiveUpdate from './commands/InteractiveUpdate';
import Wizard from './commands/Wizard';
import Changes from './commands/Changes';
import { depTypesList } from './common/dependencies';
import ErrorBoundary from './ui/ErrorBoundary/ErrorBoundary';

const renderCommand = async (Command, appConfig) => {
	const app = render(
		<ErrorBoundary>
			<Command config={appConfig} />
		</ErrorBoundary>
	);
	try {
		await app.waitUntilExit();
	} catch (error) {
		// the react app prints it's own error message
		process.exitCode = 1;
	}

	return app;
};

const renderListCommand = async ({ appConfig }) => {
	await renderCommand(List, appConfig);
};

const renderUpdateCommand = async ({ appConfig }) => {
	const Command = appConfig.interactive ? InteractiveUpdate : Update;
	await renderCommand(Command, appConfig);
};

const renderWizardCommand = async ({ appConfig }) => {
	await renderCommand(Wizard, appConfig);
};

const renderChangesCommand = async ({ appConfig }) => {
	await renderCommand(Changes, appConfig);
};

const cliCommands = [
	{
		id: 'list',
		yargsConfig: {
			command: '*',
			aliases: ['ls'],
			desc: 'list all dependencies',
			handler: renderListCommand,
		},
	},
	{
		id: 'update',
		yargsConfig: {
			command: 'update [dependencies..]',
			aliases: ['up'],
			desc: 'update dependencies',
			handler: renderUpdateCommand,
		},
	},
	{
		id: 'wizard',
		yargsConfig: {
			command: 'wizard',
			aliases: ['w'],
			desc: 'interactively add and update dependencies',
			handler: renderWizardCommand,
		},
	},
	{
		id: 'changes',
		yargsConfig: {
			command: 'changes [dependency]',
			aliases: [],
			desc: 'view changelog for a dependency',
			handler: renderChangesCommand,
		},
	},
];

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
	},
	{
		name: 'dependency',
		options: {
			describe: 'dependency to view changelog for',
			type: 'string',
			default: '',
		},
		yargsType: 'positional',
		yargsCommmands: ['changes'],
	},
	{
		name: 'deprecated',
		options: {
			describe: 'allow updating to deprecated versions',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update', 'wizard'],
	},
	{
		name: 'depTypes',
		options: {
			alias: 'd',
			describe: 'filter by dependency type',
			type: 'array',
			default: [],
			choices: Object.keys(depTypesList),
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update', 'wizard'],
	},
	{
		name: 'full',
		options: {
			alias: 'f',
			describe: 'show full changelog',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['changes'],
	},
	{
		name: 'global',
		options: {
			alias: 'g',
			describe: 'check global node modules instead of local ones',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['list'],
	},
	{
		name: 'groupByPackage',
		options: {
			alias: 'G',
			describe: 'list dependencies grouped by package',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['list'],
	},
	{
		name: 'interactive',
		options: {
			alias: 'i',
			describe: 'interactively bulk update dependencies',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['update'],
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
	},
	{
		name: 'packageManager',
		options: {
			describe: 'package manager to use',
			type: 'string',
			default: 'npm',
			choices: packageManagers.map(({ name }) => name),
		},
		getDefault: ({ packageManager: pm }) => pm?.name,
		yargsType: 'global',
		yargsCommmands: [],
	},
	{
		name: 'prerelease',
		options: {
			describe: 'allow updating to prerelease versions',
			type: 'boolean',
			default: false,
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update', 'wizard'],
	},
	{
		name: 'sort',
		options: {
			describe: 'sort dependencies',
			type: 'string',
			default: 'type',
			choices: ['name', 'date', 'type'],
		},
		yargsType: 'command',
		yargsCommmands: ['list'],
	},
	{
		name: 'updateTo',
		options: {
			alias: 'to',
			describe: 'update dependencies to semver type',
			type: 'string',
			default: 'latest',
			choices: ['latest', 'wanted'],
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update'],
	},
	{
		name: 'semver',
		options: {
			alias: 's',
			describe: 'filter by update type',
			type: 'array',
			default: [],
			choices: ['major', 'minor', 'patch'],
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update'],
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
	},
	{
		name: 'workspace',
		options: {
			alias: 'w',
			describe: 'filter dependencies by workspace',
			type: 'array',
			default: [],
		},
		yargsType: 'command',
		yargsCommmands: ['list', 'update', 'wizard'],
	},
	{
		name: 'workspaces',
		options: {
			describe: 'directories of the monorepo workspaces',
			type: 'array',
			default: [],
		},
		getDefault: async ({ packageManager: pm }) => {
			const workspaces = await pm?.packageManager.getWorkspaces();
			return workspaces || [];
		},
		yargsType: 'global',
		yargsCommmands: [],
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

const withConfig = async (argv, yargsInstance) => {
	// an array of option keys that were not user defined by argv
	const defaultedOptions = Object.keys(yargsInstance.parsed.defaulted);

	const config = (await readJsonFile('.refitrc.json')) || {};
	const packageManager = getPackageManager();

	const appConfig = {
		rootPath: process.cwd(),
	};

	for (const { name, getDefault } of configOptions) {
		// use the value from argv if it exists
		let val = argv[name];

		// if values were not defined by argv
		if (defaultedOptions.includes(name)) {
			// check config file
			if (config[name] !== undefined) {
				val = config[name];
				// custom method to determine default value
			} else if (getDefault) {
				val = await getDefault({ packageManager });
			}
		}

		appConfig[name] = val;
	}

	// eslint-disable-next-line no-param-reassign
	argv.appConfig = appConfig;
};

export {
	configOptions,
	withConfig,
	getGlobalOptions,
	getCommandOptions,
	cliCommands,
};
