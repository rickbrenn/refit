import {
	parseGitHubUrl,
	getDiffVersionParts,
} from '../src/common/dependencies';

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

describe('getDiffVersionParts', () => {
	test('should parse patch version change correctly', async () => {
		const result = getDiffVersionParts('1.2.3', '1.2.4');

		expect(result).toEqual({
			color: 'green',
			updateType: 'patch',
			wildcard: '',
			midDot: '.',
			uncoloredText: '1.2',
			coloredText: '4',
		});
	});

	test('should parse a minor version change correctly', async () => {
		const result = getDiffVersionParts('1.2.3', '1.3.0');

		expect(result).toEqual({
			color: 'yellow',
			updateType: 'minor',
			wildcard: '',
			midDot: '.',
			uncoloredText: '1',
			coloredText: '3.0',
		});
	});

	test('should parse a major version change correctly', async () => {
		const result = getDiffVersionParts('1.2.3', '2.0.0');

		expect(result).toEqual({
			color: 'red',
			updateType: 'major',
			wildcard: '',
			midDot: '',
			uncoloredText: '',
			coloredText: '2.0.0',
		});
	});

	test('should return original version when arg is set', async () => {
		const result = getDiffVersionParts('1.2.3', '1.2.4', true);

		expect(result).toEqual({
			color: 'green',
			updateType: 'patch',
			wildcard: '',
			midDot: '.',
			uncoloredText: '1.2',
			coloredText: '3',
		});
	});

	test('should consider prerelease as major', async () => {
		const result = getDiffVersionParts('0.0.1', '0.0.2');

		expect(result).toEqual({
			color: 'red',
			updateType: 'major',
			wildcard: '',
			midDot: '.',
			uncoloredText: '0.0',
			coloredText: '2',
		});
	});

	test('should handle carrot version range', async () => {
		const result = getDiffVersionParts('^1.2.3', '^1.2.4');

		expect(result).toEqual({
			color: 'green',
			updateType: 'patch',
			wildcard: '^',
			midDot: '.',
			uncoloredText: '1.2',
			coloredText: '4',
		});
	});

	test('should handle tilde version range', async () => {
		const result = getDiffVersionParts('~1.2.3', '~1.2.4');

		expect(result).toEqual({
			color: 'green',
			updateType: 'patch',
			wildcard: '~',
			midDot: '.',
			uncoloredText: '1.2',
			coloredText: '4',
		});
	});

	test('should handle differing version range', async () => {
		const result = getDiffVersionParts('^1.2.3', '1.2.4');
		const result2 = getDiffVersionParts('~1.2.3', '^1.2.4');

		expect(result).toEqual({
			color: 'green',
			updateType: 'patch',
			wildcard: '',
			midDot: '.',
			uncoloredText: '1.2',
			coloredText: '4',
		});
		expect(result2).toEqual({
			color: 'green',
			updateType: 'patch',
			wildcard: '^',
			midDot: '.',
			uncoloredText: '1.2',
			coloredText: '4',
		});
	});
});
