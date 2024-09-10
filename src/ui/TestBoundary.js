import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useApp, useStdin } from 'ink';

const TestBoundary = ({ shouldStop, children }) => {
	const { exit } = useApp();
	const { isRawModeSupported } = useStdin();

	useEffect(() => {
		if (!isRawModeSupported && shouldStop) {
			exit();
		}
	}, [shouldStop, exit, isRawModeSupported]);

	if (!isRawModeSupported) {
		return null;
	}

	return children;
};

TestBoundary.propTypes = {
	shouldStop: PropTypes.bool.isRequired,
	children: PropTypes.node.isRequired,
};

export default TestBoundary;
