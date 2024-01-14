import { existsSync } from 'fs';
import path from 'path';

import * as npm from './npm';
import * as yarn from './yarn';
import * as pnpm from './pnpm';

const packageManagers = [
	{
		name: 'npm',
		lockFile: 'package-lock.json',
		packageManager: npm,
	},
	{
		name: 'yarn',
		lockFile: 'yarn.lock',
		packageManager: yarn,
	},
	{
		name: 'pnpm',
		lockFile: 'pnpm-lock.yaml',
		packageManager: pnpm,
	},
];

const getPackageManager = () => {
	const packageManager = packageManagers.find(({ lockFile }) => {
		return existsSync(path.resolve(lockFile));
	});

	// default to npm if no lock file found
	return packageManager || packageManagers[0];
};

const getPackageManagerConfig = (packageManager) => {
	return packageManagers.find(({ name }) => name === packageManager);
};

export default packageManagers;
export { getPackageManager, getPackageManagerConfig };
