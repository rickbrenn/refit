import { jest } from '@jest/globals';

const fsMock = {
	existsSync: jest.fn(),
	readFileSync: jest.fn(),
};

jest.unstable_mockModule('fs', () => ({
	__esModule: true,
	default: fsMock,
	...fsMock,
}));

const fs = await import('fs');
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

	fs.existsSync.mockImplementation(() => true);
	fs.readFileSync
		.mockImplementation(() => JSON.stringify({}))
		.mockImplementationOnce(() => JSON.stringify(config));

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
			},
		},
	};

	withConfig(argv, yargsInstance);

	const expected = {
		all: false,
		verbose: true,
		sort: 'name',
	};

	expect(argv.appConfig.all).toEqual(expected.all);
	expect(argv.appConfig.verbose).toEqual(expected.verbose);
	expect(argv.appConfig.sort).toEqual(expected.sort);

	fs.existsSync.mockClear();
	fs.readFileSync.mockClear();
});
