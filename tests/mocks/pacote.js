import { jest } from '@jest/globals';

const pacoteMock = {
	packument: jest.fn(),
};

jest.unstable_mockModule('pacote', () => {
	return {
		__esModule: true,
		default: pacoteMock,
		...pacoteMock,
	};
});

const mockChalkData = {
	name: 'chalk',
	'dist-tags': { latest: '5.3.0' },
	versions: {
		'4.0.0': {
			name: 'chalk',
			version: '4.0.0',
		},
		'4.1.2': {
			name: 'chalk',
			version: '4.1.2',
		},
		'5.1.0': {
			name: 'chalk',
			version: '5.1.0',
		},
		'5.1.1': {
			name: 'chalk',
			version: '5.1.1',
		},
		'5.1.2': {
			name: 'chalk',
			version: '5.1.2',
		},
		'5.2.0': {
			name: 'chalk',
			version: '5.2.0',
		},
		'5.3.0': {
			name: 'chalk',
			version: '5.3.0',
		},
	},
};

const mockYargsData = {
	name: 'yargs',
	'dist-tags': { latest: '17.7.2' },
	versions: {
		'17.6.0': {
			name: 'yargs',
			version: '17.6.0',
		},
		'17.6.2': {
			name: 'yargs',
			version: '17.6.2',
		},
		'17.7.0': {
			name: 'yargs',
			version: '17.7.0',
		},
		'17.7.1': {
			name: 'yargs',
			version: '17.7.1',
		},
		'17.7.2': {
			name: 'yargs',
			version: '17.7.2',
		},
	},
};

const mockInkData = {
	name: 'ink',
	'dist-tags': { latest: '4.4.1' },
	versions: {
		'4.0.0"': {
			name: 'ink',
			version: '4.0.0"',
		},
		'4.1.0': {
			name: 'ink',
			version: '4.1.0',
		},
		'4.2.0': {
			name: 'ink',
			version: '4.2.0',
		},
		'4.3.0': {
			name: 'ink',
			version: '4.3.0',
		},
		'4.3.1': {
			name: 'ink',
			version: '4.3.1',
		},
		'4.4.0': {
			name: 'ink',
			version: '4.4.0',
		},
		'4.4.1': {
			name: 'ink',
			version: '4.4.1',
		},
	},
};

const mockMarkedData = {
	name: 'marked',
	'dist-tags': { latest: '11.1.0' },
	versions: {
		'9.0.0': {
			name: 'marked',
			version: '9.0.0',
		},
		'9.1.6': {
			name: 'marked',
			version: '9.1.6',
		},
		'10.0.0': {
			name: 'marked',
			version: '10.0.0',
		},
		'11.0.1': {
			name: 'marked',
			version: '11.0.1',
		},
		'11.1.0': {
			name: 'marked',
			version: '11.1.0',
		},
	},
};

const pacote = await import('pacote');

export default pacote;
export { mockChalkData, mockYargsData, mockInkData, mockMarkedData };
