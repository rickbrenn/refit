import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text } from 'ink';

const NameColumn = ({ row, column }) => {
	const { color, name } = row;
	const { showColor } = column;

	return (
		<Text color={showColor !== false && color} wrap="truncate">
			{name}
		</Text>
	);
};

NameColumn.propTypes = {
	row: PropTypes.shape({
		color: PropTypes.string,
		name: PropTypes.string,
	}).isRequired,
	column: PropTypes.shape({
		showColor: PropTypes.bool,
	}).isRequired,
};

export default NameColumn;
