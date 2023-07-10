import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text } from 'ink';

const UpToDateBoundary = ({ enabled, children }) => {
	return enabled ? (
		<Text color="green">All dependencies up to date</Text>
	) : (
		children
	);
};

UpToDateBoundary.propTypes = {
	enabled: PropTypes.bool.isRequired,
	children: PropTypes.node.isRequired,
};

export default UpToDateBoundary;
