import fs from 'fs';
import path from 'path';

const getInstalledDeps = async (pkgPath) => {
	const yarnDepsPath = path.resolve(pkgPath, '.yarn/cache');
	const yarnDepRegex = /^(?<name>.+)-.+-(?<version>\d+.\d+.\d+)-(.+-.+).zip$/;

	let dirList;
	try {
		dirList = fs.readdirSync(yarnDepsPath);
	} catch (error) {
		// ignore the error if the directory doesn't exist
	}

	const installedDeps = {};
	if (dirList) {
		for (const file of dirList) {
			const match = file.match(yarnDepRegex);

			if (match) {
				const { name, version } = match.groups;
				const existingDep = installedDeps[name];

				if (existingDep) {
					if (Array.isArray(existingDep)) {
						installedDeps[name] = [...existingDep, version];
					} else {
						installedDeps[name] = [existingDep, version];
					}
				} else {
					installedDeps[name] = version;
				}
			}
		}
	}

	return installedDeps;
};

// eslint-disable-next-line import/prefer-default-export
export { getInstalledDeps };
