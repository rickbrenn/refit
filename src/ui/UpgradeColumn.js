import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'ink';

const UpgradeColumn = ({ row, column }) => {
	const { color, original, upgrade } = row;
	const { showColor } = column;
	const { wildcard, midDot, uncoloredText, coloredText } =
		original.upgradeParts;

	if (!upgrade) {
		return null;
	}

	if (upgrade === 'NOT FOUND') {
		return <Text>{upgrade}</Text>;
	}

	return (
		<Text>
			{wildcard + uncoloredText + midDot}
			<Text color={showColor !== false && color}>{coloredText}</Text>
		</Text>
	);
};

UpgradeColumn.propTypes = {
	row: PropTypes.shape({
		color: PropTypes.string,
		name: PropTypes.string,
		upgrade: PropTypes.string,
		original: PropTypes.shape({
			upgradeParts: PropTypes.shape({
				wildcard: PropTypes.string,
				midDot: PropTypes.string,
				uncoloredText: PropTypes.string,
				coloredText: PropTypes.string,
			}),
		}),
	}).isRequired,
	column: PropTypes.shape({
		showColor: PropTypes.bool,
	}).isRequired,
};

export default UpgradeColumn;
