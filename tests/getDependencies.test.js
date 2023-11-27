import fs from 'fs';
import path from 'path';
import spawnAsync from '../src/common/spawnAsync';
import getDependencies from '../src/common/getDependencies';

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
	updateTo: undefined,
	updateTypes: [],
	verbose: false,
};

const cwd = 'tests/testDirs/npmBasic';

test('should contain accurate dependency info', async () => {
	await spawnAsync('npm install', { cwd });

	const dependencies = await getDependencies({
		...config,
		rootPath: cwd,
		all: true,
	});

	const [chalkData] = dependencies;

	expect(chalkData).toHaveProperty('versionRange.target', '5.3.0');
	expect(chalkData).toHaveProperty('versionRange.wanted', '5.3.0');
	expect(chalkData).toHaveProperty('version.installed', '5.3.0');
	expect(chalkData).toHaveProperty('version.wanted', '5.3.0');
	expect(chalkData).toHaveProperty('hasError', false);

	fs.rmSync(path.join(cwd, 'node_modules'), { recursive: true });
	fs.rmSync(path.join(cwd, 'package-lock.json'));
});
