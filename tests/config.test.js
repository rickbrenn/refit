import { jest } from '@jest/globals';
import packageManagers, * as realPm from '../src/common/packageManagers';

const filesystemMock = {
	readJsonFile: jest.fn(),
	readYamlFile: jest.fn(),
};

jest.unstable_mockModule('../src/common/filesystem', () => ({
	__esModule: true,
	...filesystemMock,
}));

const npmMock = {
	getWorkspaces: jest.fn(),
};

const pmMock = {
	getPackageManager: jest.fn(),
};

jest.unstable_mockModule('../src/common/packageManagers', () => ({
	...realPm,
	__esModule: true,
	...pmMock,
}));

const { getPackageManager } = await import('../src/common/packageManagers');
const { readJsonFile } = await import('../src/common/filesystem');
const { configOptions, cliCommands, withConfig } = await import(
	'../src/config'
);

test('should not have duplicate config names', () => {
	const names = configOptions.map((option) => option.name);
	const uniqueNames = [...new Set(names)];
	expect(names).toEqual(uniqueNames);
});

test('should not have duplicate config aliases', () => {
	const aliases = configOptions
		.map((option) => option.options.alias)
		.filter(Boolean);
	const uniqueAliases = [...new Set(aliases)];
	expect(aliases).toEqual(uniqueAliases);
});

test('should not have invalid yargs commands listed', () => {
	const validCommands = cliCommands.map((command) => command.id);
	const invalidCommands = configOptions
		.flatMap((option) => option.yargsCommmands)
		.filter((command) => !validCommands.includes(command));

	expect(invalidCommands).toEqual([]);
});

test('should prioritize args > config > defaults', async () => {
	const config = {
		sort: 'name',
	};

	readJsonFile.mockImplementationOnce(() => config);
	getPackageManager.mockImplementationOnce(() => ({
		...packageManagers[0],
		packageManager: npmMock,
	}));
	npmMock.getWorkspaces.mockImplementationOnce(() => ['packages/*']);

	const argv = {
		all: false,
		verbose: true,
		sort: 'type',
	};

	const yargsInstance = {
		parsed: {
			defaulted: {
				all: true,
				sort: true,
				workspaces: true,
			},
		},
	};

	await withConfig(argv, yargsInstance);

	const expected = {
		all: false,
		verbose: true,
		sort: 'name',
		workspaces: ['packages/*'],
	};

	expect(argv.appConfig.all).toEqual(expected.all);
	expect(argv.appConfig.verbose).toEqual(expected.verbose);
	expect(argv.appConfig.sort).toEqual(expected.sort);
	expect(argv.appConfig.workspaces).toEqual(expected.workspaces);

	readJsonFile.mockClear();
	getPackageManager.mockClear();
	npmMock.getWorkspaces.mockClear();
});
