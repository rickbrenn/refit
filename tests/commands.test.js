import spawnAsync from '../src/common/spawnAsync';

test('list command should run successfully', async () => {
	await expect(spawnAsync('node ./bin/cli.js')).resolves.not.toThrow();
});
