import spawnAsync from '../src/common/spawnAsync';
import { cleanupInstall, installDependencies } from './common';

const cwd = 'tests/testDirs/commands/npmBasic';
const command = 'node ../../../../bin/cli.js';

afterEach(() => {
	cleanupInstall(cwd);
});

test('testing tests', async () => {
	await installDependencies('npm', cwd);

	await expect(spawnAsync(`${command}`, { cwd })).resolves.not.toThrow();
});

test('list command should run successfully', async () => {
	await installDependencies('npm', cwd);

	await expect(spawnAsync(command, { cwd })).resolves.not.toThrow();
});

test('update command should run successfully', async () => {
	await installDependencies('npm', cwd);

	await expect(
		spawnAsync(`${command} update`, { cwd })
	).resolves.not.toThrow();
});

test('interactive update command should run successfully', async () => {
	await installDependencies('npm', cwd);

	await expect(
		spawnAsync(`${command} update -i`, { cwd })
	).resolves.not.toThrow();
});

test('wizard command should run successfully', async () => {
	await installDependencies('npm', cwd);

	await expect(spawnAsync(`${command} w`, { cwd })).resolves.not.toThrow();
});

const changelogs = ['chalk@5.3.0', 'facebook-nodejs-business-sdk@18.0.4'];

test.each(changelogs)(
	'changes command should run successfully %s',
	async (changelogCommand) => {
		await expect(
			spawnAsync(`${command} changes ${changelogCommand}`, { cwd })
		).resolves.not.toThrow();
	}
);
