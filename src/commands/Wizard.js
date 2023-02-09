import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import Loader from '../ui/Loader';
import useLoader from '../ui/useLoader';
import DependencySelector from '../ui/DependencySelector';
import getDependencies from '../common/getDependencies';

const Wizard = ({ config }) => {
	const { startLoader, dependencies, loading, loaderState } = useLoader(
		getDependencies,
		config
	);

	useEffect(() => {
		// startLoader();
	}, [startLoader]);

	// if (loading) {
	// 	return <Loader text={loaderState.text} />;
	// }

	// if (!dependencies.length) {
	// 	return <Text color="green">All dependencies up to date</Text>;
	// }

	const handleSelect = (item) => {
		console.log(item);
	};

	// list of fruit
	const items = [
		{
			name: 'webpack',
			target: '^5.74.0',
			installed: '5.74.0',
			wanted: '5.75.0',
			latest: '5.75.0',
			upgrade: '^5.75.0',
			type: 'dev',
			hoisted: 'false',
			in: 'refit',
			color: 'yellow',
			upgradeParts: {
				wildcard: '^',
				midDot: '.',
				uncoloredText: '5',
				coloredText: '75.0',
			},
		},
		{
			name: 'minimist',
			target: '^1.2.6',
			installed: '1.2.6',
			wanted: '1.2.7',
			latest: '1.2.7',
			upgrade: '^1.2.7',
			type: 'prod',
			hoisted: 'false',
			in: 'refit',
			color: 'green',
			upgradeParts: {
				wildcard: '^',
				midDot: '.',
				uncoloredText: '1.2',
				coloredText: '7',
			},
		},
		{
			name: 'semver',
			target: '^7.3.7',
			installed: '7.3.7',
			wanted: '7.3.8',
			latest: '7.3.8',
			upgrade: '^7.3.8',
			type: 'prod',
			hoisted: 'false',
			in: 'refit',
			color: 'green',
			upgradeParts: {
				wildcard: '^',
				midDot: '.',
				uncoloredText: '7.3',
				coloredText: '8',
			},
		},
	];

	return (
		<Box>
			<DependencySelector
				items={items}
				onSelect={handleSelect}
				searchByKey="name"
			/>
		</Box>
	);
};

Wizard.propTypes = {
	config: PropTypes.shape({}).isRequired,
};

export default Wizard;
