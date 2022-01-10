import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'ink';

const NameColumn = ({ row }) => {
	const { color, name } = row;
	return (
		<Text color={color} wrap="truncate">
			{name}
		</Text>
	);
};

NameColumn.propTypes = {
	row: PropTypes.shape({
		color: PropTypes.string,
		name: PropTypes.string,
	}).isRequired,
};

export default NameColumn;
