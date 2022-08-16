import path from 'path';
import fs from 'fs';

const getRootPath = (rootDir) => {
	return rootDir ? path.resolve(rootDir) : process.cwd();
};

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

export { isDirectory, hasPackageJsonFile, getRootPath };
