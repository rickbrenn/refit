import semver from 'semver';

const { semverRegex, sourceConfigs } = await import('../src/common/changelog');

const semvers = [
	'1.0.0',
	'1.0.0-alpha',
	'1.0.0-alpha.1',
	'1.0.0-0.3.7',
	'1.0.0-x.7.z.92',
	'1.0.0-alpha+001',
	'1.0.0+20130313144700',
	'1.0.0-beta+exp.sha.5114f85',
	'test v1.2.3 test 11.22.33+build.1',
	'v2.10',
];

test.each(semvers)('semver regex should match semver %s', (item) => {
	const version =
		item.match(semverRegex)?.[0] ||
		semver.coerce(item, { includePrerelease: true })?.raw;

	expect(version).toBeTruthy();
});

test('sourceConfigs should contain all fields', () => {
	for (const config of sourceConfigs) {
		expect(config.name).toBeTruthy();
		expect(config.fetch).toBeTruthy();
	}
});
