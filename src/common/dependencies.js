import pMap from 'p-map';
import pacote from 'pacote';
import semver from 'semver';
import dayjs from 'dayjs';
// eslint-disable-next-line node/file-extension-in-import
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { getPackageManagerConfig } from './packageManagers';

dayjs.extend(relativeTime);

const depTypesList = {
	dev: 'devDependencies',
	prod: 'dependencies',
	// peer: 'peerDependencies', // shouldn't update peer dependencies
	optional: 'optionalDependencies',
};

const semverUpdateColors = {
	major: 'red',
	minor: 'yellow',
	patch: 'green',
};

// TODO: could probably simplify this with the semver package
const getDiffVersionParts = (current, upgrade, returnCurrent = false) => {
	if (!current || !upgrade) {
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

	const returnParts = returnCurrent ? currentParts : upgradeParts;

	// create strings for the colored and uncolored parts of the version
	const midDot = diffIndex > 0 && diffIndex < returnParts.length ? '.' : '';
	const uncoloredText = returnParts.slice(0, diffIndex).join('.');
	const coloredText = returnParts.slice(diffIndex).join('.');

	return {
		color: semverUpdateColors[updateType],
		updateType,
		wildcard,
		midDot,
		uncoloredText,
		coloredText,
	};
};

const isPrerelease = (version) => {
	// prerelease versions return an array of prelease parts
	return semver.prerelease(version)?.length > 0;
};

const isDeprecated = (registryVersion) => {
	// deprecated versions return a deprecated key with a message
	return !!registryVersion?.deprecated;
};

const isMissing = (registryVersion) => {
	// when a package is no longer on the registry it does not have a versions key
	return !registryVersion?.versions;
};

const parseGitHubUrl = (versionString) => {
	const gitHubRegex = /^(github:)?(?<user>.+)\/(?<project>.+)#(?<ref>.+)$/;
	const match = gitHubRegex.exec(versionString);

	if (!match) {
		return null;
	}

	const { user, project, ref } = match.groups;

	const semverRegex = /^semver:(?<version>.+)$/;
	const semverMatch = semverRegex.exec(ref);
	const { version } = semverMatch?.groups || {};

	return {
		user,
		project,
		ref,
		version,
	};
};

const createDependencyObject = ({
	name = '',
	apps = [],
	version = {
		installed: '',
		wanted: '',
		latest: '',
	},
	versionRange = {
		target: '',
		wanted: '',
		latest: '',
	},
	hoisted,
	internal = false,
	deprecated = false,
	notOnRegistry = false,
	installNeeded = false,
	multipleTargets = false,
	upgradableToWanted = false,
	upgradableToLatest = false,
	color,
	updateType,
	upgradeParts = {
		wildcard: '',
		midDot: '',
		uncoloredText: '',
		coloredText: '',
	},
	versions = [],
	distTags = {},
	lastPublishedAt = '',
}) => ({
	name,
	apps,
	version,
	versionRange,
	hoisted,
	internal,
	hasError: deprecated || notOnRegistry || installNeeded || multipleTargets,
	deprecated,
	notOnRegistry,
	installNeeded,
	multipleTargets,
	upgradable: upgradableToWanted || upgradableToLatest,
	upgradableToWanted,
	upgradableToLatest,
	color,
	updateType,
	upgradeParts,
	versions,
	distTags,
	lastPublishedAt,
});

const createDependency = ({ dependency, registryData = {}, config = {} }) => {
	const {
		targetRange = '',
		installedVersion,
		apps,
		name,
		hoisted,
		internal,
		multipleTargets,
	} = dependency;
	const { allowPrerelease, allowDeprecated } = config;

	if (internal) {
		return createDependencyObject({
			name,
			apps,
			hoisted,
			versionRange: {
				target: targetRange,
				wanted: targetRange,
				latest: targetRange,
			},
			internal,
			multipleTargets,
		});
	}

	// check if the target range is a github url
	const gitHubInfo = parseGitHubUrl(targetRange);

	// use the version from the github url if it exists
	const parsedTargetRange = gitHubInfo?.version || targetRange;

	// TODO: support more semver types
	const wildcards = ['^', '~'];
	const currentWildcard =
		wildcards.find((wildcard) => parsedTargetRange.includes(wildcard)) ||
		'';

	// missing from the npm registry
	if (isMissing(registryData)) {
		return createDependencyObject({
			name,
			apps,
			hoisted,
			version: {
				installed: installedVersion,
				wanted: '',
				latest: '',
			},
			versionRange: {
				target: targetRange,
				wanted: '',
				latest: '',
			},
			internal: false,
			notOnRegistry: true,
			installNeeded: false,
			multipleTargets,
			upgradableToWanted: false,
			upgradableToLatest: false,
		});
	}

	const distTags = registryData['dist-tags'];

	// allow prerelease versions if option is set or the target range is a prerelease
	const includePrerelease =
		allowPrerelease || isPrerelease(parsedTargetRange);

	const versions = Object.keys(registryData.versions);
	const validVersions = versions.filter((version) => {
		const isPrereleaseVersion = isPrerelease(version);
		const isDeprecatedVersion = isDeprecated(
			registryData.versions[version]
		);

		const prePassed = includePrerelease || !isPrereleaseVersion;
		const depPassed = allowDeprecated || !isDeprecatedVersion;

		return prePassed && depPassed;
	});

	const wantedVersion =
		semver.maxSatisfying(versions, parsedTargetRange, {
			includePrerelease,
		}) || '';

	// will use the latest distTag if there are no valid versions. This is in the case
	// that a package only has prerelease versions but they are filtered out
	const latestVersion =
		semver.maxSatisfying(validVersions, `>=${wantedVersion}`, {
			// set to true here because they are filtered out or allowed already
			includePrerelease: true,
		}) || distTags.latest;

	const wantedRange = wantedVersion ? currentWildcard + wantedVersion : '';
	const latestRange = latestVersion ? currentWildcard + latestVersion : '';

	const upgradableToWanted = Boolean(
		parsedTargetRange && wantedRange && parsedTargetRange !== wantedRange
	);
	const upgradableToLatest = Boolean(
		parsedTargetRange && latestRange && parsedTargetRange !== latestRange
	);

	// set installed needed to false if it's a non semver github url
	const installedIsOff =
		gitHubInfo && !gitHubInfo?.version
			? false
			: !semver.satisfies(installedVersion, parsedTargetRange);
	const installNeeded = !installedVersion || installedIsOff;
	const deprecated = isDeprecated(registryData.versions[installedVersion]);

	// get coloring and version parts for the upgrade text
	const { color, updateType, wildcard, midDot, uncoloredText, coloredText } =
		getDiffVersionParts(parsedTargetRange, latestRange);

	const lastPublishedAt = registryData?.time?.[latestVersion] || '';

	return createDependencyObject({
		name,
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
		deprecated,
		notOnRegistry: false,
		installNeeded,
		multipleTargets,
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
		versions,
		distTags,
		lastPublishedAt,
	});
};

const getRegistryData = async (name, packumentOptions) => {
	let registryData = {};

	try {
		registryData = await pacote.packument(name, packumentOptions);
	} catch (error) {
		// ignore 404 errors is they get caught by isMissing
		if (error.statusCode !== 404) {
			throw error;
		}
	}

	// get the package link
	// TODO: npms has a bulk API, maybe run a bunch of these using the bulk API instead
	// TODO: will have to change this for yarn support
	// const npmsInfo = await (
	// 	await fetch(`https://api.npms.io/v2/package/${name}`)
	// ).json();
	// const npmLink = npmsInfo?.collected?.metadata?.links?.npm;

	return registryData;
};

const sortDependencies = (dependencies, sortBy) => {
	// can use toSorted array method with Node 20
	const sortedList = [...dependencies];

	// sort alphabetically by name
	if (sortBy === 'name') {
		sortedList.sort((a, b) => a.name.localeCompare(b.name));
	} else if (sortBy === 'date') {
		sortedList.sort((a, b) => {
			const aDate = dayjs(a.lastPublishedAt);
			const bDate = dayjs(b.lastPublishedAt);

			if (aDate.isSame(bDate)) {
				return a.name.localeCompare(b.name);
			}

			return aDate.isBefore(bDate) ? 1 : -1;
		});
	} else {
		// sort by semver update type
		sortedList.sort((a, b) => {
			if (
				b.updateType === a.updateType ||
				(!b.updateType && !a.updateType)
			) {
				return a.name.localeCompare(b.name);
			}

			if (b.updateType === 'major' && a.updateType !== 'major') {
				return 1;
			}

			if (
				b.updateType === 'minor' &&
				a.updateType !== 'major' &&
				a.updateType !== 'minor'
			) {
				return 1;
			}

			if (
				b.updateType === 'patch' &&
				a.updateType !== 'major' &&
				a.updateType !== 'minor' &&
				a.updateType !== 'patch'
			) {
				return 1;
			}

			return -1;
		});
	}

	return sortedList;
};

const getDependencyList = async ({
	packageList,
	filterByPackages,
	rootPath,
	filterByDeps = [],
	filterByDepTypes = [],
	updateProgress,
	pMapOptions,
	sortBy,
	ignoreInternalDeps = true,
	packumentOptions = {},
	allowDeprecated = false,
	allowPrerelease = false,
	packageManager,
	global = false,
}) => {
	const pm = getPackageManagerConfig(packageManager);

	let dependencyList = [];
	const multipleTargetVersions = [];

	if (global) {
		const globalDeps = await pm.packageManager.getGlobalDeps();

		for (const [name, version] of Object.entries(globalDeps)) {
			dependencyList.push({
				name,
				apps: [{ name: 'global', type: 'prod' }],
				targetRange: version,
				installedVersion: version,
				hoisted: false,
				internal: false,
			});
		}
	} else {
		const hoistedDeps = await pm.packageManager.getInstalledDeps(rootPath);

		let filteredPackages = packageList.values();

		if (filterByPackages.length) {
			filteredPackages = filterByPackages.reduce((acc, pkgName) => {
				if (packageList.has(pkgName)) {
					return [...acc, packageList.get(pkgName)];
				}

				return acc;
			}, []);
		}

		for (const {
			name: pkgName,
			path: pkgPath,
			isMonorepoRoot,
			dependencies,
		} of filteredPackages) {
			const installedDeps = isMonorepoRoot
				? hoistedDeps
				: await pm.packageManager.getInstalledDeps(pkgPath);

			for (const { name, target, type } of dependencies.values()) {
				const isValidName =
					!filterByDeps.length || filterByDeps.includes(name);
				const isValidType =
					!filterByDepTypes.length || filterByDepTypes.includes(type);
				const internal = packageList.has(name);

				const isValidDep =
					(ignoreInternalDeps && !internal) || !ignoreInternalDeps;

				if (isValidName && isValidType && isValidDep) {
					let hoisted = false;

					const localVersion = installedDeps[name];
					const hoistedVersion = hoistedDeps[name];

					// prefers local version over hoisted version
					let installedVersion = localVersion || hoistedVersion;

					// if multiple installed versions use the one that matches the target
					// or the highest version
					if (Array.isArray(installedVersion)) {
						const matchedVersion = installedVersion.find(
							(version) => semver.satisfies(version, target)
						);
						const highestInstalled =
							semver.sort(installedVersion)[
								installedVersion.length - 1
							];

						installedVersion = matchedVersion || highestInstalled;
					}

					if (!internal && !localVersion && hoistedVersion) {
						hoisted = true;
					}

					let existingDepIndex;
					dependencyList.forEach((dep, index) => {
						if (dep?.name === name) {
							if (dep?.targetRange !== target) {
								multipleTargetVersions.push(name);
							}

							if (
								dep?.targetRange === target &&
								dep?.installedVersion === installedVersion
							) {
								existingDepIndex = index;
							}
						}
					});

					if (existingDepIndex > -1) {
						dependencyList[existingDepIndex].apps.push({
							name: pkgName,
							type,
						});
					} else {
						dependencyList.push({
							name,
							apps: [{ name: pkgName, type }],
							targetRange: target,
							installedVersion,
							hoisted,
							internal,
						});
					}
				}
			}
		}
	}

	// create a list of package names to fetch from the registry
	// excluding internal packages and duplicate package names
	const depsToFetch = dependencyList.reduce((acc, curr) => {
		if (!curr.internal && !acc.includes(curr.name)) {
			acc.push(curr.name);
		}

		return acc;
	}, []);

	const processDependency = async (name, index) => {
		updateProgress({
			progressCurrent: index + 1,
			progressMax: depsToFetch.length,
			name,
		});

		return getRegistryData(name, packumentOptions);
	};

	const packumentData = await pMap(
		depsToFetch,
		processDependency,
		pMapOptions
	);

	const packumentMap = new Map(
		packumentData.map((data) => [data.name, data])
	);

	dependencyList = dependencyList.map((d) =>
		createDependency({
			dependency: {
				...d,
				multipleTargets: multipleTargetVersions.includes(d.name),
			},
			registryData: packumentMap.get(d.name),
			config: { allowDeprecated, allowPrerelease },
		})
	);

	return sortDependencies(dependencyList, sortBy);
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

// map the dependencies data to table row objects
const mapDataToRows = (pkgs) => {
	return pkgs.map((p) => {
		// display version to upgrade to
		const upgradeVersion = p.notOnRegistry
			? 'NOT FOUND'
			: p.upgradable && p.versionRange.latest;

		// if the dependency is not in node_modules display 'missing'
		const installedText = p.version.installed || 'MISSING';

		const latestText = p.notOnRegistry ? 'NOT FOUND' : p.version.latest;

		// how to display the list of dependencies
		const manyApps = p.apps.length > 1;
		const appsText = manyApps
			? `${p.apps.length} Packages`
			: p.apps[0].name;

		const depTypes = new Set(p.apps.map((app) => app.type));
		const typeText =
			depTypes.size > 1
				? `${depTypes.size} Types`
				: Array.from(depTypes)[0];

		const lastPublishedAtText = p.lastPublishedAt
			? dayjs().to(dayjs(p.lastPublishedAt))
			: '';

		return {
			name: p.name || '',
			target: p.versionRange.target || '',
			installed: installedText || '',
			wanted: p.version.wanted || '',
			latest: latestText || '',
			upgrade: upgradeVersion || '',
			type: typeText || '',
			hoisted: p.hoisted.toString() || '',
			in: appsText || '',
			color: p.color,
			lastPublishedAt: lastPublishedAtText,
			upgradable: p.upgradable,
			apps: p.apps,
			errors: {
				multipleTargets: p.multipleTargets,
				deprecated: p.deprecated,
				notOnRegistry: p.notOnRegistry,
				installNeeded: p.installNeeded,
			},
			upgradeParts: p.upgradeParts || {},
			key: p.name + p.versionRange.target + p.version.installed,
		};
	});
};

export {
	getDiffVersionParts,
	createDependency,
	getRegistryData,
	getDependencyList,
	getDependenciesFromPackageJson,
	mapDataToRows,
	sortDependencies,
	depTypesList,
};
