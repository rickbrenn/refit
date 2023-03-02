import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import chalk from 'chalk';
import Selector from './Selector';

const VersionSelector = ({ item, onSelect }) => {
	const items = useMemo(() => {
		const { versions, distTags } = item;

		const sortedVersions = [...versions].reverse();

		const options = [];

		for (const [key, value] of Object.entries(distTags)) {
			options.push({
				label: `${value} ${chalk.bold(`#${key}`)}`,
				value,
			});
		}

		const versionsToExclude = Object.values(distTags);
		for (const version of sortedVersions) {
			if (!versionsToExclude.includes(version)) {
				options.push({
					label: version,
					value: version,
				});
			}
		}

		return options;
	}, [item]);

	return (
		<Box flexDirection="column" marginTop={1} marginBottom={1}>
			<Box marginBottom={1}>
				<Text>Select a version below to install</Text>
			</Box>
			<Selector items={items} onSelect={onSelect} limit={8} />
		</Box>
	);
};

VersionSelector.propTypes = {
	item: PropTypes.shape({
		versions: PropTypes.arrayOf(PropTypes.string),
		distTags: PropTypes.shape({}),
	}).isRequired,
	onSelect: PropTypes.func.isRequired,
};

VersionSelector.defaultProps = {};

export default VersionSelector;
