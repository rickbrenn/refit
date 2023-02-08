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
		{ value: 'apple' },
		{ value: 'banana' },
		{ value: 'orange' },
		{ value: 'pear' },
		{ value: 'grape' },
		{ value: 'pineapple' },
		{ value: 'mango' },
		{ value: 'watermelon' },
		{ value: 'kiwi' },
		{ value: 'papaya' },
		{ value: 'peach' },
		{ value: 'apricot' },
		{ value: 'cherry' },
		{ value: 'lemon' },
		{ value: 'lime' },
		{ value: 'blueberry' },
		{ value: 'raspberry' },
		{ value: 'strawberry' },
		{ value: 'blackberry' },
		{ value: 'coconut' },
		{ value: 'fig' },
		{ value: 'pomegranate' },
		{ value: 'persimmon' },
		{ value: 'quince' },
		{ value: 'plum' },
	];

	return (
		<Box>
			<DependencySelector
				items={items}
				onSelect={handleSelect}
				searchByKey="value"
			/>
		</Box>
	);
};

Wizard.propTypes = {
	config: PropTypes.shape({}).isRequired,
};

export default Wizard;
