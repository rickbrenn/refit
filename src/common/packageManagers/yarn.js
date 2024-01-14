import path from 'path';
import { getDepsFromDirNames } from './common';
import { readJsonFile } from '../filesystem';

const getWorkspaces = async () => {
	const pkgJson = await readJsonFile('package.json');
	return pkgJson?.workspaces;
};

const getInstalledDeps = async (pkgPath) => {
	return getDepsFromDirNames(
		path.resolve(pkgPath, '.yarn/cache'),
		/^(?<name>.+)-.+-(?<version>\d+.\d+.\d+)-(.+-.+).zip$/
	);
};

const getGlobalDeps = async () => {
	const error = new Error('Yarn global dependencies are not supported');
	error.catch = true;
	throw error;
};

export { getInstalledDeps, getGlobalDeps, getWorkspaces };
