import fs from 'fs';
import ryf from 'read-yaml-file';

const readJsonFile = async (filePath) => {
	try {
		const fileContent = await fs.readFile(filePath, 'utf8');
		return JSON.parse(fileContent);
	} catch (error) {
		return undefined;
	}
};

const readYamlFile = async (filePath) => {
	try {
		return await ryf(filePath);
	} catch (error) {
		return undefined;
	}
};

export { readJsonFile, readYamlFile };
