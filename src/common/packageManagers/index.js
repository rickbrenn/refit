import { existsSync } from 'fs';
import path from 'path';

import * as npm from './npm';
import * as yarn from './yarn';

const packageManagers = [
	{
		name: 'npm',
		lockFile: 'package-lock.json',
	},
	{
		name: 'yarn',
		lockFile: 'yarn.lock',
	},
];

const determinePackageManager = () => {
	const packageManager = packageManagers.find(({ lockFile }) => {
		return existsSync(path.resolve(lockFile));
	});

	return packageManager.name || 'npm';
};

export default { npm, yarn };
export { determinePackageManager };
