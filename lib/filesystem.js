import path from 'node:path';
import fs from 'node:fs';

function isDirectory(dirPath) {
	try {
		return fs.lstatSync(dirPath).isDirectory();
	} catch (error) {
		return false;
	}
}

function hasPackageJsonFile(packagePath) {
	try {
		if (fs.existsSync(path.resolve(packagePath, 'package.json'))) {
			return true;
		}
	} catch (error) {
		return false;
	}
}

export { isDirectory, hasPackageJsonFile };
