import { configOptions } from '../src/config';

test('should not have duplicate config names', () => {
	const names = configOptions.map((option) => option.name);
	const uniqueNames = [...new Set(names)];
	expect(names).toEqual(uniqueNames);
});

test('should not have duplicate config aliases', () => {
	const aliases = configOptions
		.map((option) => option.options.alias)
		.filter(Boolean);
	const uniqueAliases = [...new Set(aliases)];
	expect(aliases).toEqual(uniqueAliases);
});
