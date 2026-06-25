import { jest } from '@jest/globals';

const spawnAsyncMock = jest.fn();

jest.unstable_mockModule('../../src/common/spawnAsync', () => ({
	default: spawnAsyncMock,
}));

const { getInstalledDeps, getGlobalDeps } =
	await import('../../src/common/packageManagers/pnpm');

const getInstalledDepsFromRawData = async (rawData) => {
	spawnAsyncMock.mockResolvedValueOnce(rawData);

	return getInstalledDeps('/repo/pkg');
};

const getGlobalDepsFromRawData = async (rawData) => {
	spawnAsyncMock.mockResolvedValueOnce(rawData);

	return getGlobalDeps();
};

beforeEach(() => {
	spawnAsyncMock.mockReset();
});

describe('pnpm package manager', () => {
	test('should parse pnpm v10 array JSON output', async () => {
		const rawData = JSON.stringify([
			{
				dependencies: {
					chalk: {
						version: '5.3.0',
					},
				},
				devDependencies: {
					jest: {
						version: '30.2.0',
					},
				},
				optionalDependencies: {
					fsevents: {
						version: '2.3.3',
					},
				},
			},
		]);

		await expect(getInstalledDepsFromRawData(rawData)).resolves.toEqual({
			chalk: '5.3.0',
			fsevents: '2.3.3',
			jest: '30.2.0',
		});
		expect(spawnAsyncMock).toHaveBeenCalledWith(
			'pnpm ls --depth=0 --json',
			{ cwd: '/repo/pkg' }
		);
	});

	test('should parse object root JSON output', async () => {
		const rawData = JSON.stringify({
			dependencies: {
				yargs: {
					version: '18.0.0',
				},
			},
		});

		await expect(getInstalledDepsFromRawData(rawData)).resolves.toEqual({
			yargs: '18.0.0',
		});
	});

	test('should parse multiple v11 global install entries', async () => {
		const rawData = JSON.stringify([
			{
				dependencies: {
					vite: {
						version: '8.0.10',
					},
				},
			},
			{
				dependencies: {
					'@github/copilot': {
						version: '1.0.39',
					},
				},
			},
		]);

		await expect(getGlobalDepsFromRawData(rawData)).resolves.toEqual({
			'@github/copilot': '1.0.39',
			vite: '8.0.10',
		});
		expect(spawnAsyncMock).toHaveBeenCalledWith(
			'pnpm ls -g --depth=0 --json'
		);
	});

	test('should normalize peer-qualified pnpm versions', async () => {
		const rawData = JSON.stringify([
			{
				dependencies: {
					ink: {
						version: '5.1.0(react@18.3.1)',
					},
					'ink-text-input': {
						version: '6.0.0(ink@5.1.0(react@18.3.1))(react@18.3.1)',
					},
				},
			},
		]);

		await expect(getInstalledDepsFromRawData(rawData)).resolves.toEqual({
			ink: '5.1.0',
			'ink-text-input': '6.0.0',
		});
	});

	test('should ignore local protocol versions', async () => {
		const rawData = JSON.stringify([
			{
				dependencies: {
					linked: {
						version: 'link:../linked',
					},
					workspace: {
						version: 'workspace:*',
					},
					file: {
						version: 'file:../file',
					},
					portal: {
						version: 'portal:../portal',
					},
					chalk: {
						version: '5.3.0',
					},
				},
			},
		]);

		await expect(getInstalledDepsFromRawData(rawData)).resolves.toEqual({
			chalk: '5.3.0',
		});
	});

	test('should collect duplicate dependencies with different installed versions', async () => {
		const rawData = JSON.stringify([
			{
				dependencies: {
					chalk: {
						version: '5.1.0',
					},
					yargs: {
						version: '18.0.0',
					},
				},
			},
			{
				dependencies: {
					chalk: {
						version: '5.3.0',
					},
					yargs: {
						version: '18.0.0',
					},
				},
			},
		]);

		await expect(getInstalledDepsFromRawData(rawData)).resolves.toEqual({
			chalk: ['5.1.0', '5.3.0'],
			yargs: '18.0.0',
		});
	});

	test('should return empty deps for malformed local JSON', async () => {
		await expect(
			getInstalledDepsFromRawData('chalk@5.3.0')
		).resolves.toEqual({});
	});

	test('should parse line-oriented global fallback output conservatively', async () => {
		const rawData = [
			'@eslint/config-inspector@2.0.0',
			'@github/copilot@1.0.39',
			'vite@8.0.10',
			'invalid',
			'latest-only@latest',
		].join('\n');

		await expect(getGlobalDepsFromRawData(rawData)).resolves.toEqual({
			'@eslint/config-inspector': '2.0.0',
			'@github/copilot': '1.0.39',
			vite: '8.0.10',
		});
	});
});
