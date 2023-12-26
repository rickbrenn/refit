import { parseGitHubUrl } from '../src/common/dependencies';

describe('parseGitHubUrl', () => {
	test('should parse github git urls', async () => {
		const result = parseGitHubUrl('git+https://github.com/chalk/chalk.git');

		expect(result.user).toEqual('chalk');
		expect(result.project).toEqual('chalk');
	});

	test('should parse github http urls', async () => {
		const result = parseGitHubUrl('git://github.com/mqttjs/MQTT.js.git');

		expect(result.user).toEqual('mqttjs');
		expect(result.project).toEqual('MQTT.js');
	});

	test('should parse github version urls', async () => {
		const result = parseGitHubUrl('github:chalk/chalk#5.3.0');

		expect(result.user).toEqual('chalk');
		expect(result.project).toEqual('chalk');
		expect(result.ref).toEqual('5.3.0');
	});

	test('should parse github version urls with semver', async () => {
		const result = parseGitHubUrl('github:chalk/chalk#semver:5.3.0');

		expect(result.user).toEqual('chalk');
		expect(result.project).toEqual('chalk');
		expect(result.ref).toEqual('semver:5.3.0');
		expect(result.version).toEqual('5.3.0');
	});
});
