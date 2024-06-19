import React from 'react';
import PropTypes from 'prop-types';
import { Box, useFocus } from 'ink';

const FocusTarget = ({
	active = false,
	id,
	autoFocus = false,
	children = null,
	keepRendered = true,
}) => {
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

export default FocusTarget;
