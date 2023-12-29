import fs from 'fs';
import path from 'path';
import spawnAsync from '../src/common/spawnAsync';

const installDependencies = async (packageManager, cwd) => {
	return spawnAsync(`${packageManager} install`, { cwd });
};

const cleanupInstall = (cwd) => {
	fs.rmSync(path.join(cwd, 'node_modules'), { force: true, recursive: true });
	fs.rmSync(path.join(cwd, '.yarn'), { force: true, recursive: true });
	fs.rmSync(path.join(cwd, 'package-lock.json'), { force: true });
	fs.rmSync(path.join(cwd, 'pnpm-lock.yaml'), { force: true });
	fs.rmSync(path.join(cwd, '.pnp.cjs'), { force: true });
	fs.rmSync(path.join(cwd, '.pnp.loader.mjs'), { force: true });
};

export { installDependencies, cleanupInstall };
