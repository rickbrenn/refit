import path from 'path';
import { getDepsFromDirNames } from './common';
import spawnAsync from '../spawnAsync';

const getInstalledDeps = async (pkgPath) => {
	return getDepsFromDirNames(
		path.resolve(pkgPath, 'node_modules/.pnpm'),
		/^(?<name>.+)@(?<version>\d+.\d+.\d+)/
	);
};

const getGlobalDeps = async () => {
	const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

	const command = `${pnpmCmd} ls -g --depth=0 --json`;
	const result = await spawnAsync(command);
	let parsedDeps = {};

	try {
		parsedDeps = JSON.parse(result)?.[0]?.dependencies;
	} catch (error) {
		// ignore error
	}

	const globalDeps = {};
	for (const [name, data] of Object.entries(parsedDeps)) {
		// ignore linked packages
		if (!data.version.startsWith('link:')) {
			globalDeps[name] = data.version;
		}
	}

	return globalDeps;
};

export { getInstalledDeps, getGlobalDeps };
