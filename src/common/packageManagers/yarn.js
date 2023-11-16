import path from 'path';
import { getDepsFromDirNames } from './common';

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

export { getInstalledDeps, getGlobalDeps };
