import path from 'path';
import { getDepsFromDirNames } from './common';

const getInstalledDeps = async (pkgPath) => {
	return getDepsFromDirNames(
		path.resolve(pkgPath, '.yarn/cache'),
		/^(?<name>.+)-.+-(?<version>\d+.\d+.\d+)-(.+-.+).zip$/
	);
};

// eslint-disable-next-line import/prefer-default-export
export { getInstalledDeps };
