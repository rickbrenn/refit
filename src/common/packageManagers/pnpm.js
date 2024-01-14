import spawnAsync from '../spawnAsync';
import { depTypesList } from '../dependencies';
import { readYamlFile } from '../filesystem';

const getPnpmCommand = () => {
	return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
};

const getWorkspaces = async () => {
	const yamlContent = await readYamlFile('pnpm-workspace.yaml');
	return yamlContent?.packages;
};

const parsePnpmDeps = (rawData) => {
	let parsedDeps = {};

	try {
		const validTypes = Object.values(depTypesList);
		for (const type of validTypes) {
			const depsOfType = JSON.parse(rawData)?.[0]?.[type] ?? {};
			parsedDeps = { ...parsedDeps, ...depsOfType };
		}
	} catch (error) {
		// ignore error
	}

	const deps = {};
	for (const [name, data] of Object.entries(parsedDeps)) {
		// ignore linked packages
		if (!data.version.startsWith('link:')) {
			deps[name] = data.version;
		}
	}

	return deps;
};

const getInstalledDeps = async (pkgPath) => {
	const pnpmCmd = getPnpmCommand();
	const command = `${pnpmCmd} ls --depth=0 --json`;
	const result = await spawnAsync(command, { cwd: pkgPath });

	return parsePnpmDeps(result);
};

const getGlobalDeps = async () => {
	const pnpmCmd = getPnpmCommand();
	const command = `${pnpmCmd} ls -g --depth=0 --json`;
	const result = await spawnAsync(command);

	return parsePnpmDeps(result);
};

export { getInstalledDeps, getGlobalDeps, getWorkspaces };
