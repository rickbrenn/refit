import pMap from 'p-map';
import pacote from 'pacote';
import semver from 'semver';
import Arborist from '@npmcli/arborist';

const depTypesList = {
	dev: 'devDependencies',
	prod: 'dependencies',
	peer: 'peerDependencies',
	optional: 'optionalDependencies',
};

const semverUpdateColors = {
	major: 'red',
	minor: 'yellow',
	patch: 'green',
};

const getDiffVersionParts = (current, upgrade) => {
	if (!current || !upgrade || current === upgrade) {
		return {};
	}

	// check for a wildcard
	const upgradeHasWildcard = /^[~^]/.test(upgrade);
	const hasSameWildcard = upgradeHasWildcard && upgrade[0] === current[0];

	// define wildcard and versions to compare
	const wildcard = hasSameWildcard ? upgrade[0] : '';
	const upgradeVersion = hasSameWildcard ? upgrade.slice(1) : upgrade;
	const currentVersion = hasSameWildcard ? current.slice(1) : current;

	// split versions into parts
	const upgradeParts = upgradeVersion.split('.');
	const currentParts = currentVersion.split('.');

	// check where upgrade and current versions differ (major, minor, patch)
	let diffIndex = upgradeParts.findIndex((v, i) => v !== currentParts[i]);
	diffIndex = diffIndex >= 0 ? diffIndex : upgradeParts.length;
	const isMajorChange = diffIndex === 0;
	const isMinorChange = diffIndex === 1;
	const isPatchChange = diffIndex === 2;
	const isPreRelease = upgradeParts[0] === '0';

	// set update type for change
	let updateType;
	if (isMajorChange || isPreRelease) {
		updateType = 'major';
	}

	if (isMinorChange && !isPreRelease) {
		updateType = 'minor';
	}

	if (isPatchChange && !isPreRelease) {
		updateType = 'patch';
	}

	// create strings for the colored and uncolored parts of the version
	const midDot = diffIndex > 0 && diffIndex < upgradeParts.length ? '.' : '';
	const uncoloredText = upgradeParts.slice(0, diffIndex).join('.');
	const coloredText = upgradeParts.slice(diffIndex).join('.');

	return {
		color: semverUpdateColors[updateType],
		updateType,
		wildcard,
		midDot,
		uncoloredText,
		coloredText,
	};
};

const getDependencyInfo = async ({
	targetRange,
	installedVersion,
	apps,
	name,
	type,
	hoisted,
	internal,
}) => {
	try {
		if (internal) {
			return {
				name,
				type,
				apps,
				hoisted,
				version: {
					installed: '',
					wanted: '',
					latest: '',
				},
				versionRange: {
					target: targetRange,
					wanted: targetRange,
					latest: targetRange,
				},
				internal,
				missing: false,
				installNeeded: false,
				upgradable: false,
				upgradableToWanted: false,
				upgradableToLatest: false,
				color: '',
				updateType: '',
				upgradeParts: {
					wildcard: '',
					midDot: '',
					uncoloredText: '',
					coloredText: '',
				},
			};
		}

		// TODO: support more semver types
		const wildcards = ['^', '~'];
		const currentWildcard =
			wildcards.find((wildcard) => targetRange.includes(wildcard)) || '';

		const registryData = await pacote.packument(name, {}); // TODO: add optional options?

		const versions = Object.keys(registryData.versions);

		// versions
		const wantedVersion = semver.maxSatisfying(versions, targetRange);
		const latestVersion = registryData['dist-tags'].latest;

		// ranges
		const wantedRange = currentWildcard + wantedVersion;
		const latestRange = currentWildcard + latestVersion;

		// upgrades
		const upgradableToWanted = targetRange !== wantedRange;
		const upgradableToLatest = targetRange !== latestRange;
		const upgradable = upgradableToWanted || upgradableToLatest;

		// issues
		const missing = !installedVersion;
		const installedIsOff = !semver.satisfies(installedVersion, targetRange);
		const installNeeded = missing || installedIsOff;

		// get coloring and version parts for the upgrade text
		const {
			color,
			updateType,
			wildcard,
			midDot,
			uncoloredText,
			coloredText,
		} = getDiffVersionParts(targetRange, latestRange);

		// get the package link
		// TODO: npms has a bulk API, maybe run a bunch of these using the bulk API instead
		// TODO: will have to change this for yarn support
		// const npmsInfo = await (
		// 	await fetch(`https://api.npms.io/v2/package/${name}`)
		// ).json();
		// const npmLink = npmsInfo?.collected?.metadata?.links?.npm;

		return {
			name,
			type,
			apps,
			hoisted,
			version: {
				installed: installedVersion,
				wanted: wantedVersion,
				latest: latestVersion,
			},
			versionRange: {
				target: targetRange,
				wanted: wantedRange,
				latest: latestRange,
			},
			internal,
			missing,
			installNeeded,
			upgradable,
			upgradableToWanted,
			upgradableToLatest,
			color,
			updateType,
			upgradeParts: {
				wildcard,
				midDot,
				uncoloredText,
				coloredText,
			},
		};
	} catch (error) {
		return {
			name,
			type,
			apps,
			hoisted,
			version: {
				installed: '',
				current: '',
				wanted: '',
				latest: '',
			},
			versionRange: {
				target: '',
				wanted: '',
				latest: '',
			},
			internal,
			missing: true,
			installNeeded: true,
			upgradable: true,
			upgradableToWanted: true,
			upgradableToLatest: true,
			color: '',
			updateType: '',
			upgradeParts: {
				wildcard: '',
				midDot: '',
				uncoloredText: '',
				coloredText: '',
			},
		};
	}
};

const getInstalledDeps = async (pkgPath) => {
	const arb = new Arborist({ path: pkgPath });
	const { children: installedDeps } = await arb.loadActual();

	return installedDeps;
};

const getDependencyList = async ({
	packageList,
	isHoisted,
	rootPath,
	filterByDeps = [],
	filterByTypes = [],
	updateProgress,
	pMapOptions,
}) => {
	const hoistedDeps = isHoisted
		? await getInstalledDeps(rootPath)
		: new Map();

	const dependencyList = [];
	for (const {
		name: pkgName,
		path: pkgPath,
		isMonorepoRoot,
		dependencies,
	} of packageList.values()) {
		const isHoistedRoot = isHoisted && isMonorepoRoot;
		const installedDeps = isHoistedRoot
			? hoistedDeps
			: await getInstalledDeps(pkgPath);

		for (const { name, target, type } of dependencies.values()) {
			const isValidName =
				!filterByDeps.length || filterByDeps.includes(name);
			const isValidType =
				!filterByTypes.length || filterByTypes.includes(type);
			if (isValidName && isValidType) {
				const internal = packageList.has(name);
				let hoisted = false;
				const installedDep = installedDeps?.get(name);
				const hoistedDep = hoistedDeps?.get(name);
				const installedVersion = (installedDep || hoistedDep)?.version;

				if (!internal && !installedDep && hoistedDep) {
					hoisted = true;
				}

				const existingDepIndex = dependencyList.findIndex((dep) => {
					return (
						dep?.name === name &&
						dep?.targetRange === target &&
						dep?.installedVersion === installedVersion
					);
				});

				if (existingDepIndex > -1) {
					dependencyList[existingDepIndex].apps.push(pkgName);
				} else {
					dependencyList.push({
						name,
						apps: [pkgName],
						type,
						targetRange: target,
						installedVersion,
						hoisted,
						internal,
					});
				}
			}
		}
	}

	const processDependency = async (dependencyData, index) => {
		const progressCurrent = index + 1;
		const progressMax = dependencyList.length;

		updateProgress(progressCurrent, progressMax, dependencyData.name);

		return getDependencyInfo(dependencyData);
	};

	return pMap(dependencyList, processDependency, pMapOptions);
};

const getDependenciesFromPackageJson = ({ pkgJsonData }) => {
	const dependenciesMap = new Map();

	for (const [depTypeShort, depTypeLong] of Object.entries(depTypesList)) {
		const depsOfType = pkgJsonData[depTypeLong];

		if (depsOfType) {
			for (const [depName, depSpec] of Object.entries(depsOfType)) {
				dependenciesMap.set(depName, {
					name: depName,
					target: depSpec,
					type: depTypeShort,
				});
			}
		}
	}

	return dependenciesMap;
};

export {
	getDependencyInfo,
	getDependencyList,
	getDependenciesFromPackageJson,
	getInstalledDeps,
	depTypesList,
};
