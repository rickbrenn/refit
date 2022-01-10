import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';

const Loader = ({ frames, interval, text, loaderColor, textColor }) => {
	const [frame, setFrame] = useState(0);
	const timer = useRef();

	useEffect(() => {
		if (timer.current) {
			clearInterval(timer.current);
		}

		timer.current = setInterval(() => {
			setFrame((previousFrame) => {
				const isLastFrame = previousFrame === frames.length - 1;
				return isLastFrame ? 0 : previousFrame + 1;
			});
		}, interval);

		return () => {
			clearInterval(timer.current);
		};
	}, [frames, interval]);

	return (
		<Box>
			<Text color={loaderColor}>{frames[frame]}</Text>
			<Text color={textColor}>{text}</Text>
		</Box>
	);
};

Loader.propTypes = {
	frames: PropTypes.arrayOf(PropTypes.string),
	interval: PropTypes.number,
	text: PropTypes.string,
	loaderColor: PropTypes.string,
	textColor: PropTypes.string,
};

Loader.defaultProps = {
	frames: ['__🚚', '_🚚_', '🚚__'],
	interval: 180,
	text: 'loading..',
	loaderColor: 'yellow',
	textColor: undefined,
};

export default Loader;
