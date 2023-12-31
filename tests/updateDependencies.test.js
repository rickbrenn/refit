import PackageJson from '@npmcli/package-json';

const { default: pacote, mockChalkData } = await import('./mocks/pacote');
const { default: updateDependencies } = await import(
	'../src/common/updateDependencies'
);

const config = {
	rootPath: '.',
	all: false,
	concurrency: 8,
	dependencies: undefined,
	deprecated: false,
	depTypes: [],
	global: false,
	groupByPackage: false,
	interactive: undefined,
	noIssues: false,
	packageDirs: undefined,
	packageManager: 'npm',
	prerelease: false,
	packages: [],
	sort: 'type',
	updateTo: 'latest',
	updateTypes: [],
	verbose: false,
};

const cwd = 'tests/testDirs/updateDependencies/npmOutdated';
const originalPkgJson = await PackageJson.load(cwd);

test('should update dependencies to latest', async () => {
	pacote.packument.mockImplementation(() => mockChalkData);

	const dependencies = await updateDependencies({
		...config,
		rootPath: cwd,
		updateTo: 'latest',
	});

	const [chalkData] = dependencies;

	const newPkgJson = await PackageJson.load(cwd);

	expect(chalkData).toHaveProperty('upgradeVersion', '^5.3.0');
	expect(newPkgJson).toHaveProperty('content.dependencies.chalk', '^5.3.0');

	newPkgJson.update({
		dependencies: originalPkgJson.content.dependencies,
	});

	await newPkgJson.save();
	pacote.packument.mockClear();
});

test('should update dependencies to wanted', async () => {
	pacote.packument.mockImplementation(() => mockChalkData);

	const dependencies = await updateDependencies({
		...config,
		rootPath: cwd,
		updateTo: 'wanted',
	});

	const [chalkData] = dependencies;

	const newPkgJson = await PackageJson.load(cwd);

	expect(chalkData).toHaveProperty('upgradeVersion', '^4.1.2');
	expect(newPkgJson).toHaveProperty('content.dependencies.chalk', '^4.1.2');

	newPkgJson.update({
		dependencies: originalPkgJson.content.dependencies,
	});

	await newPkgJson.save();
	pacote.packument.mockClear();
});
