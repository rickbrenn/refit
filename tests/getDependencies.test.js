import fs from 'fs';
import path from 'path';
import { cleanupInstall } from './common';

const {
	default: pacote,
	mockChalkData,
	mockYargsData,
	mockInkData,
	mockMarkedData,
} = await import('./mocks/pacote');
const { default: getDependencies } = await import(
	'../src/common/getDependencies'
);

const config = {
	rootPath: '.',
	all: false,
	dependencies: undefined,
	deprecated: false,
	depTypes: [],
	global: false,
	groupByPackage: false,
	interactive: undefined,
	noIssues: false,
	workspaces: undefined,
	packageManager: 'npm',
	prerelease: false,
	workspace: [],
	sort: 'type',
	updateTo: undefined,
	semver: [],
	verbose: false,
};

describe('npm', () => {
	test('should contain accurate data for up to date dependency', async () => {
		const cwd = 'tests/testDirs/getDependencies/npmBasic';

		pacote.packument.mockImplementation(() => mockChalkData);

		const dependencies = await getDependencies({
			...config,
			rootPath: cwd,
			all: true,
		});

		const [chalkData] = dependencies;

		expect(chalkData).toHaveProperty('versionRange.target', '5.3.0');
		expect(chalkData).toHaveProperty('versionRange.wanted', '5.3.0');
		expect(chalkData).toHaveProperty('version.wanted', '5.3.0');

		cleanupInstall(cwd);
		pacote.packument.mockClear();
	});

	test('should contain accurate data for outdated dependency', async () => {
		const cwd = 'tests/testDirs/getDependencies/npmOutdated';

		pacote.packument.mockImplementation(() => mockChalkData);

		const dependencies = await getDependencies({
			...config,
			rootPath: cwd,
		});

		const [chalkData] = dependencies;

		expect(chalkData).toHaveProperty('versionRange.target', '^4.0.0');
		expect(chalkData).toHaveProperty('versionRange.wanted', '^4.1.2');
		expect(chalkData).toHaveProperty('versionRange.latest', '^5.3.0');
		expect(chalkData).toHaveProperty('version.wanted', '4.1.2');
		expect(chalkData).toHaveProperty('version.latest', '5.3.0');

		cleanupInstall(cwd);
		pacote.packument.mockClear();
	});

	test('should contain accurate data for different version ranges', async () => {
		const cwd = 'tests/testDirs/getDependencies/npmRanges';

		pacote.packument
			.mockImplementationOnce(() => mockChalkData)
			.mockImplementationOnce(() => mockYargsData)
			.mockImplementationOnce(() => mockInkData)
			.mockImplementationOnce(() => mockMarkedData);

		const dependencies = await getDependencies({
			...config,
			rootPath: cwd,
		});

		const chalkData = dependencies.find((dep) => dep.name === 'chalk');
		const yargsData = dependencies.find((dep) => dep.name === 'yargs');
		const inkData = dependencies.find((dep) => dep.name === 'ink');
		const markedData = dependencies.find((dep) => dep.name === 'marked');

		expect(chalkData).toHaveProperty('versionRange.target', '^5.1.0');
		expect(chalkData).toHaveProperty('versionRange.wanted', '^5.3.0');
		expect(chalkData).toHaveProperty('versionRange.latest', '^5.3.0');
		expect(chalkData).toHaveProperty('version.wanted', '5.3.0');
		expect(chalkData).toHaveProperty('version.latest', '5.3.0');

		expect(yargsData).toHaveProperty('versionRange.target', '~17.7.0');
		expect(yargsData).toHaveProperty('versionRange.wanted', '~17.7.2');
		expect(yargsData).toHaveProperty('versionRange.latest', '~17.7.2');
		expect(yargsData).toHaveProperty('version.wanted', '17.7.2');
		expect(yargsData).toHaveProperty('version.latest', '17.7.2');

		expect(inkData).toHaveProperty('versionRange.target', '=4.4.0');
		expect(inkData).toHaveProperty('versionRange.wanted', '=4.4.0');
		expect(inkData).toHaveProperty('versionRange.latest', '=4.4.1');
		expect(inkData).toHaveProperty('version.wanted', '4.4.0');
		expect(inkData).toHaveProperty('version.latest', '4.4.1');

		expect(markedData).toHaveProperty('versionRange.target', '>9.0.0');
		expect(markedData).toHaveProperty('versionRange.wanted', '>11.1.0');
		expect(markedData).toHaveProperty('versionRange.latest', '>11.1.0');
		expect(markedData).toHaveProperty('version.wanted', '11.1.0');
		expect(markedData).toHaveProperty('version.latest', '11.1.0');

		cleanupInstall(cwd);
		pacote.packument.mockClear();
	});

	test('should contain accurate data for workspaces', async () => {
		const cwd = 'tests/testDirs/getDependencies/npmWorkspaces';

		pacote.packument
			.mockImplementationOnce(() => mockChalkData)
			.mockImplementationOnce(() => mockYargsData)
			.mockImplementationOnce(() => mockInkData)
			.mockImplementationOnce(() => mockMarkedData);

		const dependencies = await getDependencies({
			...config,
			workspaces: ['packages/*'],
			rootPath: cwd,
			all: true,
		});

		const chalkData = dependencies.find(
			(dep) =>
				dep.name === 'chalk' && dep?.versionRange?.target === '^5.1.0'
		);
		const chalk2Data = dependencies.find(
			(dep) =>
				dep.name === 'chalk' && dep?.versionRange?.target === '^5.3.0'
		);
		const yargsData = dependencies.find((dep) => dep.name === 'yargs');
		const inkData = dependencies.find((dep) => dep.name === 'ink');
		const markedData = dependencies.find((dep) => dep.name === 'marked');

		expect(chalkData).toHaveProperty('versionRange.target', '^5.1.0');
		expect(chalkData).toHaveProperty('versionRange.wanted', '^5.3.0');
		expect(chalkData).toHaveProperty('versionRange.latest', '^5.3.0');
		expect(chalkData).toHaveProperty('version.wanted', '5.3.0');
		expect(chalkData).toHaveProperty('version.latest', '5.3.0');
		expect(chalkData).toHaveProperty(['apps', 0, 'name'], 'package-b');
		expect(chalkData).toHaveProperty('hasError', true);
		expect(chalkData).toHaveProperty('multipleTargets', true);

		expect(chalk2Data).toHaveProperty('versionRange.target', '^5.3.0');
		expect(chalk2Data).toHaveProperty('versionRange.wanted', '^5.3.0');
		expect(chalk2Data).toHaveProperty('versionRange.latest', '^5.3.0');
		expect(chalk2Data).toHaveProperty('version.wanted', '5.3.0');
		expect(chalk2Data).toHaveProperty('version.latest', '5.3.0');
		expect(chalk2Data).toHaveProperty(
			'apps',
			expect.arrayContaining([
				expect.objectContaining({
					name: 'npmWorkspaces',
					type: 'prod',
				}),
			])
		);
		expect(chalk2Data).toHaveProperty(
			'apps',
			expect.arrayContaining([
				expect.objectContaining({
					name: 'package-a',
					type: 'prod',
				}),
			])
		);
		expect(chalk2Data).toHaveProperty('hasError', true);
		expect(chalk2Data).toHaveProperty('multipleTargets', true);

		expect(yargsData).toHaveProperty('versionRange.target', '^17.7.0');
		expect(yargsData).toHaveProperty('versionRange.wanted', '^17.7.2');
		expect(yargsData).toHaveProperty('versionRange.latest', '^17.7.2');
		expect(yargsData).toHaveProperty('version.wanted', '17.7.2');
		expect(yargsData).toHaveProperty('version.latest', '17.7.2');
		expect(yargsData).toHaveProperty(['apps', 0, 'name'], 'package-b');

		expect(inkData).toHaveProperty('versionRange.target', '^4.4.0');
		expect(inkData).toHaveProperty('versionRange.wanted', '^4.4.1');
		expect(inkData).toHaveProperty('versionRange.latest', '^4.4.1');
		expect(inkData).toHaveProperty('version.wanted', '4.4.1');
		expect(inkData).toHaveProperty('version.latest', '4.4.1');
		expect(inkData).toHaveProperty(['apps', 0, 'name'], 'npmWorkspaces');

		expect(markedData).toHaveProperty('versionRange.target', '^9.0.0');
		expect(markedData).toHaveProperty('versionRange.wanted', '^9.1.6');
		expect(markedData).toHaveProperty('versionRange.latest', '^11.1.0');
		expect(markedData).toHaveProperty('version.wanted', '9.1.6');
		expect(markedData).toHaveProperty('version.latest', '11.1.0');
		expect(markedData).toHaveProperty(['apps', 0, 'name'], 'package-b');

		cleanupInstall(cwd);
		pacote.packument.mockClear();
	});
});

describe('pnpm', () => {
	test('should contain accurate data for workspaces', async () => {
		const cwd = 'tests/testDirs/getDependencies/pnpmWorkspaces';

		pacote.packument
			.mockImplementationOnce(() => mockChalkData)
			.mockImplementationOnce(() => mockYargsData)
			.mockImplementationOnce(() => mockInkData)
			.mockImplementationOnce(() => mockMarkedData);

		const dependencies = await getDependencies({
			...config,
			workspaces: ['packages/*'],
			packageManager: 'pnpm',
			rootPath: cwd,
			all: true,
		});

		const chalkData = dependencies.find(
			(dep) =>
				dep.name === 'chalk' && dep?.versionRange?.target === '^5.1.0'
		);
		const chalk2Data = dependencies.find(
			(dep) =>
				dep.name === 'chalk' && dep?.versionRange?.target === '^5.3.0'
		);
		const yargsData = dependencies.find((dep) => dep.name === 'yargs');
		const inkData = dependencies.find((dep) => dep.name === 'ink');
		const markedData = dependencies.find((dep) => dep.name === 'marked');

		expect(chalkData).toHaveProperty('versionRange.target', '^5.1.0');
		expect(chalkData).toHaveProperty('versionRange.wanted', '^5.3.0');
		expect(chalkData).toHaveProperty('versionRange.latest', '^5.3.0');
		expect(chalkData).toHaveProperty('version.wanted', '5.3.0');
		expect(chalkData).toHaveProperty('version.latest', '5.3.0');
		expect(chalkData).toHaveProperty(['apps', 0, 'name'], 'pnpm-package-b');
		expect(chalkData).toHaveProperty('hasError', true);
		expect(chalkData).toHaveProperty('multipleTargets', true);

		expect(chalk2Data).toHaveProperty('versionRange.target', '^5.3.0');
		expect(chalk2Data).toHaveProperty('versionRange.wanted', '^5.3.0');
		expect(chalk2Data).toHaveProperty('versionRange.latest', '^5.3.0');
		expect(chalk2Data).toHaveProperty('version.wanted', '5.3.0');
		expect(chalk2Data).toHaveProperty('version.latest', '5.3.0');
		expect(chalk2Data).toHaveProperty(
			'apps',
			expect.arrayContaining([
				expect.objectContaining({
					name: 'pnpmWorkspaces',
					type: 'prod',
				}),
			])
		);
		expect(chalk2Data).toHaveProperty(
			'apps',
			expect.arrayContaining([
				expect.objectContaining({
					name: 'pnpm-package-a',
					type: 'prod',
				}),
			])
		);
		expect(chalk2Data).toHaveProperty('hasError', true);
		expect(chalk2Data).toHaveProperty('multipleTargets', true);

		expect(yargsData).toHaveProperty('versionRange.target', '^17.7.0');
		expect(yargsData).toHaveProperty('versionRange.wanted', '^17.7.2');
		expect(yargsData).toHaveProperty('versionRange.latest', '^17.7.2');
		expect(yargsData).toHaveProperty('version.wanted', '17.7.2');
		expect(yargsData).toHaveProperty('version.latest', '17.7.2');
		expect(yargsData).toHaveProperty(['apps', 0, 'name'], 'pnpm-package-b');

		expect(inkData).toHaveProperty('versionRange.target', '^4.4.0');
		expect(inkData).toHaveProperty('versionRange.wanted', '^4.4.1');
		expect(inkData).toHaveProperty('versionRange.latest', '^4.4.1');
		expect(inkData).toHaveProperty('version.wanted', '4.4.1');
		expect(inkData).toHaveProperty('version.latest', '4.4.1');
		expect(inkData).toHaveProperty(['apps', 0, 'name'], 'pnpmWorkspaces');

		expect(markedData).toHaveProperty('versionRange.target', '^9.0.0');
		expect(markedData).toHaveProperty('versionRange.wanted', '^9.1.6');
		expect(markedData).toHaveProperty('versionRange.latest', '^11.1.0');
		expect(markedData).toHaveProperty('version.wanted', '9.1.6');
		expect(markedData).toHaveProperty('version.latest', '11.1.0');
		expect(markedData).toHaveProperty(
			['apps', 0, 'name'],
			'pnpm-package-b'
		);

		cleanupInstall(cwd);
		pacote.packument.mockClear();
	});
});

describe('yarn', () => {
	test('should contain accurate data for workspaces', async () => {
		const cwd = 'tests/testDirs/getDependencies/yarnWorkspaces';

		pacote.packument
			.mockImplementationOnce(() => mockChalkData)
			.mockImplementationOnce(() => mockYargsData)
			.mockImplementationOnce(() => mockInkData)
			.mockImplementationOnce(() => mockMarkedData);

		const dependencies = await getDependencies({
			...config,
			workspaces: ['packages/*'],
			packageManager: 'yarn',
			rootPath: cwd,
			all: true,
		});

		const chalkData = dependencies.find(
			(dep) =>
				dep.name === 'chalk' && dep?.versionRange?.target === '^5.1.0'
		);
		const chalk2Data = dependencies.find(
			(dep) =>
				dep.name === 'chalk' && dep?.versionRange?.target === '^5.3.0'
		);
		const yargsData = dependencies.find((dep) => dep.name === 'yargs');
		const inkData = dependencies.find((dep) => dep.name === 'ink');
		const markedData = dependencies.find((dep) => dep.name === 'marked');

		expect(chalkData).toHaveProperty('versionRange.target', '^5.1.0');
		expect(chalkData).toHaveProperty('versionRange.wanted', '^5.3.0');
		expect(chalkData).toHaveProperty('versionRange.latest', '^5.3.0');
		expect(chalkData).toHaveProperty('version.wanted', '5.3.0');
		expect(chalkData).toHaveProperty('version.latest', '5.3.0');
		expect(chalkData).toHaveProperty(['apps', 0, 'name'], 'yarn-package-b');
		expect(chalkData).toHaveProperty('hasError', true);
		expect(chalkData).toHaveProperty('multipleTargets', true);

		expect(chalk2Data).toHaveProperty('versionRange.target', '^5.3.0');
		expect(chalk2Data).toHaveProperty('versionRange.wanted', '^5.3.0');
		expect(chalk2Data).toHaveProperty('versionRange.latest', '^5.3.0');
		expect(chalk2Data).toHaveProperty('version.wanted', '5.3.0');
		expect(chalk2Data).toHaveProperty('version.latest', '5.3.0');
		expect(chalk2Data).toHaveProperty(
			'apps',
			expect.arrayContaining([
				expect.objectContaining({
					name: 'yarn-workspaces',
					type: 'prod',
				}),
			])
		);
		expect(chalk2Data).toHaveProperty(
			'apps',
			expect.arrayContaining([
				expect.objectContaining({
					name: 'yarn-package-a',
					type: 'prod',
				}),
			])
		);
		expect(chalk2Data).toHaveProperty('hasError', true);
		expect(chalk2Data).toHaveProperty('multipleTargets', true);

		expect(yargsData).toHaveProperty('versionRange.target', '^17.7.0');
		expect(yargsData).toHaveProperty('versionRange.wanted', '^17.7.2');
		expect(yargsData).toHaveProperty('versionRange.latest', '^17.7.2');
		expect(yargsData).toHaveProperty('version.wanted', '17.7.2');
		expect(yargsData).toHaveProperty('version.latest', '17.7.2');
		expect(yargsData).toHaveProperty(['apps', 0, 'name'], 'yarn-package-b');

		expect(inkData).toHaveProperty('versionRange.target', '^4.4.0');
		expect(inkData).toHaveProperty('versionRange.wanted', '^4.4.1');
		expect(inkData).toHaveProperty('versionRange.latest', '^4.4.1');
		expect(inkData).toHaveProperty('version.wanted', '4.4.1');
		expect(inkData).toHaveProperty('version.latest', '4.4.1');
		expect(inkData).toHaveProperty(['apps', 0, 'name'], 'yarn-workspaces');

		expect(markedData).toHaveProperty('versionRange.target', '^9.0.0');
		expect(markedData).toHaveProperty('versionRange.wanted', '^9.1.6');
		expect(markedData).toHaveProperty('versionRange.latest', '^11.1.0');
		expect(markedData).toHaveProperty('version.wanted', '9.1.6');
		expect(markedData).toHaveProperty('version.latest', '11.1.0');
		expect(markedData).toHaveProperty(
			['apps', 0, 'name'],
			'yarn-package-b'
		);

		cleanupInstall(cwd);
		fs.openSync(path.join(cwd, 'yarn.lock'), 'w');
		pacote.packument.mockClear();
	});
});
