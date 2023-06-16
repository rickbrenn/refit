import path from 'path';
import fs from 'fs';

const isDirectory = (dirPath) => {
	try {
		return fs.lstatSync(dirPath).isDirectory();
	} catch (error) {
		return false;
	}
};

const hasPackageJsonFile = (packagePath) => {
	try {
		if (fs.existsSync(path.resolve(packagePath, 'package.json'))) {
			return true;
		}

		return false;
	} catch (error) {
		return false;
	}
};

export { isDirectory, hasPackageJsonFile };
