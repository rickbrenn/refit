import spawnAsync from '../src/common/spawnAsync';
import { cleanupInstall, installDependencies } from './common';

const cwd = 'tests/testDirs/npmBasic';
const command = 'node ../../../bin/cli.js';

test('list command should run successfully', async () => {
	await installDependencies('npm', cwd);

	await expect(spawnAsync(command, { cwd })).resolves.not.toThrow();

	cleanupInstall(cwd);
});

test('update command should run successfully', async () => {
	await installDependencies('npm', cwd);

	await expect(
		spawnAsync(`${command} update`, { cwd })
	).resolves.not.toThrow();

	cleanupInstall(cwd);
});

test('interactive update command should run successfully', async () => {
	await installDependencies('npm', cwd);

	await expect(
		spawnAsync(`${command} update -i`, { cwd })
	).resolves.not.toThrow();

	cleanupInstall(cwd);
});

test('wizard command should run successfully', async () => {
	await installDependencies('npm', cwd);

	await expect(spawnAsync(`${command} w`, { cwd })).resolves.not.toThrow();

	cleanupInstall(cwd);
});

test('changes command should run successfully', async () => {
	await expect(
		spawnAsync(`${command} changes chalk@5.3.0`, { cwd })
	).resolves.not.toThrow();
});
