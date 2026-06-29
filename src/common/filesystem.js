import fs from 'node:fs';
import { readYamlFile as readYaml } from 'read-yaml-file';

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
		return await readYaml(filePath);
	} catch (error) {
		return undefined;
	}
};

export { readJsonFile, readYamlFile };
