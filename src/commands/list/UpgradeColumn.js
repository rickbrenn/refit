import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'ink';

const UpgradeColumn = ({ row }) => {
	const { color, upgradeParts, upgrade } = row;
	const { wildcard, midDot, uncoloredText, coloredText } = upgradeParts;

	if (!upgrade) {
		return null;
	}

	return (
		<Text>
			{wildcard + uncoloredText + midDot}
			<Text color={color}>{coloredText}</Text>
		</Text>
	);
};

UpgradeColumn.propTypes = {
	row: PropTypes.shape({
		color: PropTypes.string,
		name: PropTypes.string,
		upgrade: PropTypes.string,
		upgradeParts: PropTypes.shape({
			wildcard: PropTypes.string,
			midDot: PropTypes.string,
			uncoloredText: PropTypes.string,
			coloredText: PropTypes.string,
		}),
	}).isRequired,
};

export default UpgradeColumn;
