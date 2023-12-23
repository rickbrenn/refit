const { semverRegex, sourceConfigs } = await import('../src/common/changelog');

test('semver regex should match semver', () => {
	expect('1.0.0'.match(semverRegex)).toBeTruthy();
	expect('1.0.0-alpha'.match(semverRegex)).toBeTruthy();
	expect('1.0.0-alpha.1'.match(semverRegex)).toBeTruthy();
	expect('1.0.0-0.3.7'.match(semverRegex)).toBeTruthy();
	expect('1.0.0-x.7.z.92'.match(semverRegex)).toBeTruthy();
	expect('1.0.0-alpha+001'.match(semverRegex)).toBeTruthy();
	expect('1.0.0+20130313144700'.match(semverRegex)).toBeTruthy();
	expect('1.0.0-beta+exp.sha.5114f85'.match(semverRegex)).toBeTruthy();
	expect('test v1.2.3 test 11.22.33+build.1'.match(semverRegex)).toBeTruthy();
});

test('sourceConfigs should contain all fields', () => {
	for (const config of sourceConfigs) {
		expect(config.name).toBeTruthy();
		expect(config.fetch).toBeTruthy();
	}
});
