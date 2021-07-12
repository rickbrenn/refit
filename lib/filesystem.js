const path = require('path');
const fs = require('fs');

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

module.exports = {
	isDirectory,
	hasPackageJsonFile,
};
