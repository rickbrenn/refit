import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import Loader from '../../ui/Loader.js';
import getDependencies from '../../common/getDependencies.js';
import updateDependencies from '../../common/updateDependencies.js';

const Update = ({ config }) => {
	const [loading, setLoading] = useState(true);
	const [loaderState, setLoaderState] = useState({
		text: 'Loading the truck..',
	});

	// TODO: move to common place to share with List
	// function called for each dependency that is processed in getDependencies
	const updateProgress = (progressCurrent, progressMax, packageName) => {
		const percentComplete = (progressCurrent * 100) / progressMax;
		const fixedPercent = percentComplete.toFixed();

		setLoaderState({
			text: `Delivering packages | ${fixedPercent}% | ${packageName}`,
		});
	};

	const fetchAndUpdateDependencies = useCallback(async () => {
		try {
			// get dependencies data
			const dependenciesData = await getDependencies(
				config,
				updateProgress
			);

			// TODO: change loader here?

			await updateDependencies(dependenciesData, config);

			setLoading(false);
		} catch (error) {
			setLoaderState({
				text: 'Error!',
			});
			throw error;
		}
	}, [config]);

	useEffect(() => {
		fetchAndUpdateDependencies();
	}, [fetchAndUpdateDependencies]);

	if (loading) {
		return <Loader text={loaderState.text} />;
	}

	return <Text>done!</Text>;
};

Update.propTypes = {
	config: PropTypes.shape({}).isRequired,
};

export default Update;
