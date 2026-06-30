import pacote from 'pacote';
import semver from 'semver';
import dayjs from 'dayjs';

// eslint-disable-next-line import-x/extensions
import relativeTime from 'dayjs/plugin/relativeTime.js';

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

const validWildcards = ['', '^', '~', '>', '<', '=', '>=', '<='];

const wildcardRegex = /^(?<wildcard>[()<=>^~]+)?(?<version>.+)/;

const getDiffVersionParts = (current, upgrade, returnCurrent = false) => {
	const currentMatches = wildcardRegex.exec(current);
	const upgradeMatches = wildcardRegex.exec(upgrade);

	if (!currentMatches || !upgradeMatches) {
		return {};
	}

	const { version: currentVersion } = currentMatches.groups;
	const { wildcard: upgradeWildcard, version: upgradeVersion } =
		upgradeMatches.groups;

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
		wildcard: upgradeWildcard || '',
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

const parseGitHubUrl = (url) => {
	const gitHubRegex =
		/^(github:|(git\+)?(https|git|ssh):\/\/(git@)?github.com\/)?(?<user>.+)\/(?<project>.+)(\.git|#(?<ref>.+))$/;
	const match = gitHubRegex.exec(url);

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

// match a package name against a minimumReleaseAgeExclude pattern, supporting
// simple globs like "@myorg/*"
const minAgeExcludeMatchesName = (pattern, name) => {
	if (pattern.includes('*')) {
		const escaped = pattern
			.split('*')
			.map((part) => part.replace(/[$()+.?[\\\]^{|}]/g, '\\$&'))
			.join('.*');

		return new RegExp(`^${escaped}$`).test(name);
	}

	return pattern === name;
};

// determine if a package version is exempt from the minimum release age check.
// entries can be a plain name, a glob (e.g. "@myorg/*"), or "name@versionRange"
const isExcludedFromMinAge = (name, version, excludeList = []) => {
	for (const entry of excludeList) {
		if (typeof entry !== 'string') {
			continue;
		}

		// find the separator between name and version range, ignoring the
		// leading '@' of scoped package names
		const separatorIndex = entry.lastIndexOf('@');
		const hasVersion = separatorIndex > 0;

		const namePart = hasVersion ? entry.slice(0, separatorIndex) : entry;
		const versionPart = hasVersion
			? entry.slice(separatorIndex + 1).trim()
			: '';

		if (!minAgeExcludeMatchesName(namePart, name)) {
			continue;
		}

		// a name-only (or glob) entry excludes all versions of the package
		if (!versionPart) {
			return true;
		}

		if (version && semver.satisfies(version, versionPart)) {
			return true;
		}
	}

	return false;
};

// determine if a package version is old enough to satisfy a minimum release age
// (in minutes). versions that are excluded or have no publish time are allowed,
// mirroring pnpm's minimumReleaseAge / minimumReleaseAgeIgnoreMissingTime
const versionMeetsMinReleaseAge = ({
	name,
	version,
	publishedAt,
	minReleaseAge = 0,
	minReleaseAgeExclude = [],
	now = Date.now(),
}) => {
	const minReleaseAgeMs = (minReleaseAge || 0) * 60 * 1000;

	if (minReleaseAgeMs <= 0) {
		return true;
	}

	if (isExcludedFromMinAge(name, version, minReleaseAgeExclude)) {
		return true;
	}

	if (!publishedAt) {
		return true;
	}

	return now - new Date(publishedAt).getTime() >= minReleaseAgeMs;
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
	upgradeVersion,
	upgradeParts = {
		wildcard: '',
		midDot: '',
		uncoloredText: '',
		coloredText: '',
	},
	versions = [],
	distTags = {},
	lastPublishedAt = '',
	newestVersion = '',
	newestPublishedAt = '',
	heldBackByMinAge = false,
	versionTimes = {},
	minReleaseAge = 0,
	minReleaseAgeExclude = [],
	url = '',
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
	upgradeVersion,
	upgradeParts,
	versions,
	distTags,
	lastPublishedAt,
	newestVersion,
	newestPublishedAt,
	heldBackByMinAge,
	versionTimes,
	minReleaseAge,
	minReleaseAgeExclude,
	url,
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
	const {
		allowPrerelease,
		allowDeprecated,
		updateTo,
		minReleaseAge = 0,
		minReleaseAgeExclude = [],
	} = config;

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

	// get the current wildcard from the target range
	const matches = wildcardRegex.exec(parsedTargetRange);
	const currentWildcard = matches?.groups?.wildcard || '';

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

	// determine if a version is old enough to be installed under the configured
	// minimum release age (mirrors pnpm's minimumReleaseAge behavior)
	const now = Date.now();
	const versionTimes = registryData?.time || {};

	const meetsMinReleaseAge = (version) =>
		versionMeetsMinReleaseAge({
			name,
			version,
			publishedAt: versionTimes[version],
			minReleaseAge,
			minReleaseAgeExclude,
			now,
		});

	// will use the latest distTag if there are no valid versions. This is in the case
	// that a package only has prerelease versions but they are filtered out
	const newestVersion =
		semver.maxSatisfying(validVersions, `>=${wantedVersion}`, {
			// set to true here because they are filtered out or allowed already
			includePrerelease: true,
		}) || distTags.latest;

	// the recommended version is the newest one old enough to satisfy the
	// minimum release age, falling back to the newest version when none qualify
	const ageEligibleVersions = validVersions.filter(meetsMinReleaseAge);
	const latestVersion =
		semver.maxSatisfying(ageEligibleVersions, `>=${wantedVersion}`, {
			includePrerelease: true,
		}) || newestVersion;

	const heldBackByMinAge = Boolean(
		minReleaseAge > 0 &&
		newestVersion &&
		latestVersion &&
		newestVersion !== latestVersion
	);

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

	const upgradeVersion = updateTo === 'wanted' ? wantedRange : latestRange;

	// get coloring and version parts for the upgrade text
	const { color, updateType, wildcard, midDot, uncoloredText, coloredText } =
		getDiffVersionParts(parsedTargetRange, upgradeVersion);

	const lastPublishedAt = versionTimes[latestVersion] || '';
	const newestPublishedAt = versionTimes[newestVersion] || '';
	const url = registryData?.repository?.url || '';

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
		upgradeVersion,
		upgradeParts: {
			wildcard,
			midDot,
			uncoloredText,
			coloredText,
		},
		versions,
		distTags,
		lastPublishedAt,
		newestVersion,
		newestPublishedAt,
		heldBackByMinAge,
		versionTimes,
		minReleaseAge,
		minReleaseAgeExclude,
		url,
	});
};

const getRegistryData = async (name, packumentOptions) => {
	let registryData = {};

	try {
		registryData = await pacote.packument(name, packumentOptions);
	} catch (error) {
		// ignore 404 errors so they get caught by isMissing
		if (error.statusCode !== 404) {
			throw error;
		}
	}

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

const filterDependencies = (
	dependencies,
	{ all, semver: semvers, noIssues }
) => {
	return all
		? dependencies
		: dependencies.filter((pkg) => {
				const isValidType =
					!semvers?.length || semvers?.includes(pkg.updateType);

				if (isValidType) {
					if (pkg.upgradable) {
						return true;
					}

					return !noIssues && pkg.hasError;
				}

				return false;
			});
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
const mapDataToRows = (pkgs, config) => {
	return pkgs.map((p) => {
		// display version to upgrade to
		const upgradeVersion = p.notOnRegistry
			? 'NOT FOUND'
			: p.upgradable && p.versionRange[config.updateTo];

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
			depTypes.size > 1 ? `${depTypes.size} Types` : [...depTypes][0];

		const lastPublishedAtText = p.lastPublishedAt
			? dayjs().to(dayjs(p.lastPublishedAt))
			: '';

		// surface a newer version that is being withheld by the minimum release
		// age, along with how recently it was published
		const heldBackText =
			p.heldBackByMinAge && p.newestVersion
				? `${p.newestVersion}${
						p.newestPublishedAt
							? ` (${dayjs().to(dayjs(p.newestPublishedAt))})`
							: ''
					}`
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
			heldBack: heldBackText,
			original: p,
			key: p.name + p.versionRange.target + p.version.installed,
		};
	});
};

export {
	getDiffVersionParts,
	createDependency,
	parseGitHubUrl,
	getRegistryData,
	getDependenciesFromPackageJson,
	mapDataToRows,
	sortDependencies,
	filterDependencies,
	depTypesList,
	validWildcards,
	versionMeetsMinReleaseAge,
};
