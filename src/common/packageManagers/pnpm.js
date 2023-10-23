import path from 'path';
import { getDepsFromDirNames } from './common';

const getInstalledDeps = async (pkgPath) => {
	return getDepsFromDirNames(
		path.resolve(pkgPath, 'node_modules/.pnpm'),
		/^(?<name>.+)@(?<version>\d+.\d+.\d+)/
	);
};

// eslint-disable-next-line import/prefer-default-export
export { getInstalledDeps };
