const semverUpdateColors = {
	major: 'red',
	minor: 'yellow',
	patch: 'green',
};

const getDiffVersionParts = (current, upgrade) => {
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

	if (isMinorChange) {
		updateType = 'minor';
	}

	if (isPatchChange) {
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

export default getDiffVersionParts;
