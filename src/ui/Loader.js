import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';

const defaultFrames = ['__🚚', '_🚚_', '🚚__'];

const Loader = ({
	frames = defaultFrames,
	interval = 180,
	text = 'loading..',
	loaderColor = 'yellow',
	textColor = undefined,
}) => {
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
		<Box gap={1}>
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

export default Loader;
