import fs from 'node:fs';

const getDepsFromDirNames = (path, dirRegex) => {
	let dirList;
	try {
		dirList = fs.readdirSync(path);
	} catch (error) {
		// ignore the error if the directory doesn't exist
	}

	const installedDeps = {};
	if (dirList) {
		for (const file of dirList) {
			const match = file.match(dirRegex);

			if (match) {
				const { name, version } = match.groups;
				const existingDep = installedDeps[name];

				if (existingDep) {
					installedDeps[name] = Array.isArray(existingDep)
						? [...existingDep, version]
						: [existingDep, version];
				} else {
					installedDeps[name] = version;
				}
			}
		}
	}

	return installedDeps;
};

// eslint-disable-next-line import-x/prefer-default-export
export { getDepsFromDirNames };
