import fs from 'fs';

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
export { getDepsFromDirNames };
