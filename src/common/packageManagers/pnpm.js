import semver from 'semver';

import spawnAsync from '../spawnAsync';
import { depTypesList } from '../dependencies';
import { readYamlFile } from '../filesystem';

const getPnpmCommand = () => {
	return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
};

const getWorkspaces = async () => {
	const yamlContent = await readYamlFile('pnpm-workspace.yaml');
	return yamlContent?.packages;
};

// pnpm v11 turns on supply-chain protection by default, delaying installs of
// recently published versions. v10 and below default to no delay.
const PNPM_V11_DEFAULT_MIN_RELEASE_AGE = 1440;

const getPnpmMajorVersion = async () => {
	const pnpmCmd = getPnpmCommand();

	try {
		const result = await spawnAsync(`${pnpmCmd} --version`);
		const parsed = semver.valid(semver.coerce(result.trim()));
		return parsed ? semver.major(parsed) : undefined;
	} catch (error) {
		return undefined;
	}
};

// read pnpm's minimumReleaseAge settings, falling back to pnpm's own version
// defaults when the setting is not explicitly configured
const getReleaseAgeConfig = async () => {
	const yamlContent = await readYamlFile('pnpm-workspace.yaml');

	const excludeRaw = yamlContent?.minimumReleaseAgeExclude;
	const minimumReleaseAgeExclude = Array.isArray(excludeRaw)
		? excludeRaw
		: [];

	const configuredAge = yamlContent?.minimumReleaseAge;

	if (typeof configuredAge === 'number') {
		return {
			minimumReleaseAge: configuredAge,
			minimumReleaseAgeExclude,
		};
	}

	const majorVersion = await getPnpmMajorVersion();
	const minimumReleaseAge =
		majorVersion >= 11 ? PNPM_V11_DEFAULT_MIN_RELEASE_AGE : 0;

	return {
		minimumReleaseAge,
		minimumReleaseAgeExclude,
	};
};

const ignoredVersionPrefixes = ['link:', 'workspace:', 'file:', 'portal:'];

const normalizePnpmVersion = (version) => {
	if (typeof version !== 'string') {
		return;
	}

	if (ignoredVersionPrefixes.some((prefix) => version.startsWith(prefix))) {
		return;
	}

	return semver.valid(version) || semver.valid(version.split('(')[0]);
};

const addDepVersion = (deps, name, version) => {
	const normalizedVersion = normalizePnpmVersion(version);

	if (!normalizedVersion) {
		return;
	}

	const existingVersion = deps[name];

	if (!existingVersion) {
		deps[name] = normalizedVersion;
		return;
	}

	if (existingVersion === normalizedVersion) {
		return;
	}

	if (Array.isArray(existingVersion)) {
		if (!existingVersion.includes(normalizedVersion)) {
			existingVersion.push(normalizedVersion);
		}

		return;
	}

	deps[name] = [existingVersion, normalizedVersion];
};

const getDepVersion = (depData) => {
	if (typeof depData === 'string') {
		return depData;
	}

	return depData?.version;
};

const parsePnpmJsonDeps = (rawData) => {
	let parsedData;

	try {
		parsedData = JSON.parse(rawData);
	} catch (error) {
		return;
	}

	const entries = Array.isArray(parsedData) ? parsedData : [parsedData];
	const deps = {};
	const validTypes = Object.values(depTypesList);

	for (const entry of entries) {
		for (const type of validTypes) {
			const depsOfType = entry?.[type] ?? {};

			for (const [name, depData] of Object.entries(depsOfType)) {
				addDepVersion(deps, name, getDepVersion(depData));
			}
		}
	}

	return deps;
};

const parsePnpmGlobalTextDeps = (rawData) => {
	const deps = {};

	for (const line of rawData.split('\n')) {
		const entry = line.trim();
		const separatorIndex = entry.lastIndexOf('@');

		if (separatorIndex <= 0) {
			continue;
		}

		const name = entry.slice(0, separatorIndex);
		const version = entry.slice(separatorIndex + 1);

		addDepVersion(deps, name, version);
	}

	return deps;
};

const parsePnpmDeps = (rawData, { globalFallback = false } = {}) => {
	const jsonDeps = parsePnpmJsonDeps(rawData);

	if (jsonDeps) {
		return jsonDeps;
	}

	return globalFallback ? parsePnpmGlobalTextDeps(rawData) : {};
};

const getInstalledDeps = async (pkgPath) => {
	const pnpmCmd = getPnpmCommand();
	const command = `${pnpmCmd} ls --depth=0 --json`;
	const result = await spawnAsync(command, { cwd: pkgPath });

	return parsePnpmDeps(result);
};

const getGlobalDeps = async () => {
	const pnpmCmd = getPnpmCommand();
	const command = `${pnpmCmd} ls -g --depth=0 --json`;
	const result = await spawnAsync(command);

	return parsePnpmDeps(result, { globalFallback: true });
};

export { getInstalledDeps, getGlobalDeps, getWorkspaces, getReleaseAgeConfig };
