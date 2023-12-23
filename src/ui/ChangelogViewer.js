import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Box, Text, useInput } from 'ink';
import open from 'open';
import useListInput from './useListInput';
import useComponentSize from './useComponentSize';
import { sourceConfigs } from '../common/changelog';

const getNextSource = (data, source) => {
	const sourceIndex = sourceConfigs.findIndex(
		(sourceConfig) => sourceConfig.name === source
	);

	if (sourceIndex === -1) {
		throw new Error(`Source not found: ${source}`);
	}

	const nextSourceIndex =
		sourceIndex === sourceConfigs.length - 1 ? 0 : sourceIndex + 1;

	const nextSource = sourceConfigs[nextSourceIndex];

	return data[nextSource.name] ? nextSource.name : null;
};

const ChangelogViewer = ({
	name,
	url,
	exitText,
	onExit,
	data,
	height,
	width,
	baseIndex,
}) => {
	const [currentIndex] = useListInput({
		baseIndex: baseIndex || 0,
		shouldLoop: false,
		listLength: data.length,
		upKey: (input, key) => key.leftArrow,
		downKey: (input, key) => key.rightArrow,
	});
	const [contentRef, contentSize, measuerContent] = useComponentSize();
	const [footerRef, footerSize] = useComponentSize();
	const [headerRef, headerSize] = useComponentSize();
	const [top, setTop] = useState(0);
	const [preferredSource, setPreferredSource] = useState('changelog');

	const currentVersion = data[currentIndex];

	const nextSource = getNextSource(currentVersion, preferredSource);
	const source =
		!currentVersion[preferredSource] && nextSource
			? nextSource
			: preferredSource;

	// reset scroll position when changing versions
	useEffect(() => {
		setTop(0);
	}, [currentIndex]);

	// measure content height when changing versions
	useEffect(() => {
		measuerContent();
	}, [currentIndex, measuerContent]);

	const viewPortHeight = height - footerSize.height - headerSize.height - 2;
	const maxTop = Math.max(0, contentSize.height - viewPortHeight);
	const scrollPercent =
		!maxTop || !top ? 0 : Math.floor((top / maxTop) * 100);

	useInput((input, key) => {
		// scroll up
		if (key.upArrow) {
			setTop((prevState) => Math.max(0, prevState - 1));
		}

		// scroll down
		if (key.downArrow) {
			setTop((prevState) => Math.min(maxTop, prevState + 1));
		}

		if (input === 's') {
			setPreferredSource((prevState) => {
				const nextState = getNextSource(currentVersion, source);
				return nextState || prevState;
			});
		}

		if (input === 'o') {
			open(url);
		}

		if (input === 'q') {
			onExit();
		}
	});

	const displayIndexes = useMemo(() => {
		const paginationIndexes = Object.keys(data);

		if (paginationIndexes.length <= 3) {
			return paginationIndexes;
		}

		// beginning
		if (currentIndex === 0) {
			return paginationIndexes.slice(0, 3);
		}

		// end
		if (currentIndex === paginationIndexes.length - 1) {
			return paginationIndexes.slice(-3);
		}

		// rest
		return paginationIndexes.slice(currentIndex - 1, currentIndex + 2);
	}, [currentIndex, data]);

	return (
		<Box
			height={height}
			width={width}
			flexDirection="column"
			borderStyle="round"
		>
			<Box
				ref={headerRef}
				borderStyle="double"
				borderTop={false}
				borderRight={false}
				borderLeft={false}
				flexShrink={0}
				paddingLeft={1}
				paddingRight={1}
				gap={2}
				width="100%"
				overflow="hidden"
				alignItems="flex-start"
				justifyContent="space-between"
			>
				<Box overflow="hidden" flexGrow={1} flexBasis={0}>
					<Text bold color="blue" wrap="truncate">
						{name}
					</Text>
				</Box>
				<Box gap={1}>
					<Box gap={2}>
						{sourceConfigs.map((sourceConfig) => {
							const isActive = sourceConfig.name === source;

							return (
								<Text
									bold
									key={sourceConfig.name}
									color={isActive ? 'green' : 'grey'}
									dimColor={
										!currentVersion[sourceConfig.name]
									}
								>
									{sourceConfig.name}
								</Text>
							);
						})}
					</Box>
					<Text bold>|</Text>
					<Box gap={2}>
						{displayIndexes.map((index) => {
							const parsedIndex = parseInt(index, 10);
							const version = data[parsedIndex];
							const isActive = parsedIndex === currentIndex;

							return (
								<Text
									bold
									key={version.version}
									color={isActive ? 'green' : 'grey'}
								>
									{version.version}
								</Text>
							);
						})}
					</Box>
				</Box>
			</Box>
			<Box
				height="100%"
				width="100%"
				flexDirection="column"
				overflow="hidden"
			>
				<Box
					ref={contentRef}
					flexShrink={0}
					flexDirection="column"
					marginTop={-top}
					width="100%"
					paddingLeft={1}
					paddingRight={1}
					paddingTop={1}
					paddingBottom={1}
				>
					<Text>{currentVersion[source]}</Text>
				</Box>
			</Box>
			<Box
				ref={footerRef}
				borderStyle="double"
				borderBottom={false}
				borderRight={false}
				borderLeft={false}
				flexShrink={0}
				paddingLeft={1}
				paddingRight={1}
				justifyContent="space-between"
				gap={2}
			>
				<Box gap={2}>
					<Text bold>
						{exitText}: <Text color="blue">q</Text>
					</Text>
					<Text bold>
						verison: <Text color="blue">◄</Text>{' '}
						<Text color="blue">►</Text>
					</Text>
					<Text bold>
						source: <Text color="blue">s</Text>
					</Text>
					<Text bold>
						open: <Text color="blue">o</Text>
					</Text>
					{maxTop > 0 && (
						<Text bold>
							scroll: <Text color="blue">▲</Text>{' '}
							<Text color="blue">▼</Text>
						</Text>
					)}
				</Box>
				<Box width={4} justifyContent="flex-end">
					{maxTop > 0 && (
						<Text bold color="blue">
							{scrollPercent}%
						</Text>
					)}
				</Box>
			</Box>
		</Box>
	);
};

ChangelogViewer.propTypes = {
	name: PropTypes.string.isRequired,
	url: PropTypes.string.isRequired,
	data: PropTypes.arrayOf(
		PropTypes.shape({
			version: PropTypes.string.isRequired,
		})
	).isRequired,
	height: PropTypes.number,
	width: PropTypes.number,
	exitText: PropTypes.string,
	onExit: PropTypes.func.isRequired,
	baseIndex: PropTypes.number,
};

ChangelogViewer.defaultProps = {
	height: undefined,
	width: undefined,
	exitText: 'exit',
	baseIndex: 0,
};

export default ChangelogViewer;
