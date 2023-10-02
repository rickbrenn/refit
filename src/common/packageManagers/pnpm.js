import fs from 'fs';
import path from 'path';

const getInstalledDeps = async (pkgPath) => {
	// Construct the path to the pnpm-lock.yaml file
	const pnpmLockPath = path.join(pkgPath, 'pnpm-lock.yaml');

	let pnpmLockData;
	try {
		pnpmLockData = fs.readFileSync(pnpmLockPath, 'utf8');
	} catch (error) {
		console.error('Error reading or parsing pnpm-lock.yaml:', error);
	}

	const dependencies = {};

	if (pnpmLockData) {
		const lines = pnpmLockData.split('\n');

		let inPackageSection = false;

		for (const line of lines) {
			const trimmedLine = line.trim();

			if (trimmedLine === 'packages:') {
				inPackageSection = true;
			} else if (inPackageSection && trimmedLine.startsWith('  ')) {
				const [key, value] = trimmedLine.split(':');
				if (key && value) {
					const packageName = key.trim();
					// value is the package version
					dependencies[packageName] = value.trim();
				}
			} else {
				break;
			}
		}
	}

	return dependencies;
};

// eslint-disable-next-line import/prefer-default-export
export { getInstalledDeps };
