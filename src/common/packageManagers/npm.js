import Arborist from '@npmcli/arborist';
import spawnAsync from '../spawnAsync';
import { readJsonFile } from '../filesystem';

const getWorkspaces = async () => {
	const pkgJson = await readJsonFile('package.json');
	return pkgJson?.workspaces;
};

const getInstalledDeps = async (pkgPath) => {
	const arb = new Arborist({ path: pkgPath });
	const { children: arbInstalledDeps } = await arb.loadActual();

	const installedDeps = {};
	for (const [name, data] of arbInstalledDeps) {
		installedDeps[name] = data.version;
	}

	return installedDeps;
};

const getGlobalDeps = async () => {
	const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

	const command = `${npmCmd} ls -g --depth=0 --json`;
	const result = await spawnAsync(command);
	let parsedDeps = {};

	try {
		parsedDeps = JSON.parse(result)?.dependencies;
	} catch (error) {
		// ignore error
	}

	const globalDeps = {};
	for (const [name, data] of Object.entries(parsedDeps)) {
		// ignore linked packages
		if (!data.resolved) {
			globalDeps[name] = data.version;
		}
	}

	return globalDeps;
};

export { getInstalledDeps, getGlobalDeps, getWorkspaces };
