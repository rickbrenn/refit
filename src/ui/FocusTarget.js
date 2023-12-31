import React from 'react';
import PropTypes from 'prop-types';
import { Box, useFocus } from 'ink';

const FocusTarget = ({ active, id, autoFocus, children, keepRendered }) => {
	const { isFocused } = useFocus({ autoFocus, id });
	const isActive = active && isFocused;

	return (
		<Box display={isActive ? 'flex' : 'none'}>
			{isActive || keepRendered ? children(isFocused) : null}
		</Box>
	);
};

FocusTarget.propTypes = {
	id: PropTypes.string.isRequired,
	autoFocus: PropTypes.bool,
	children: PropTypes.func,
	active: PropTypes.bool,
	keepRendered: PropTypes.bool,
};

FocusTarget.defaultProps = {
	autoFocus: false,
	children: null,
	active: false,
	keepRendered: true,
};

export default FocusTarget;
