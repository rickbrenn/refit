import React, { useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from 'ink';
import updateDependencies from '../common/updateDependencies';
import { mapDataToRows } from '../common/dependencies';
import { getUpdateColumns } from '../ui/columns';
import Table from '../ui/Table';
import Static from '../ui/Static';
import UpToDateBoundary from '../ui/UpToDateBoundary';
import LoaderBoundary from '../ui/LoaderBoundary';
import useDependencyLoader from '../ui/useDependencyLoader';
import { useError } from '../ui/ErrorBoundary';

const Update = ({ config }) => {
	const [dependencies, setDependencies] = useState([]);
	const [errorMessage, setErrorMessage] = useState('');
	const { loading, updateLoading, loaderText, updateProgress } =
		useDependencyLoader();
	const { setError } = useError();

	const startLoader = useCallback(async () => {
		try {
			// get dependencies data
			const dependenciesData = await updateDependencies(
				config,
				updateProgress
			);

			// format the data for the tab rows
			const formattedData = mapDataToRows(dependenciesData, config);

			setDependencies(formattedData);
			updateLoading(false);
		} catch (error) {
			if (error.catch) {
				setErrorMessage(error.message);
				updateLoading(false);
			} else {
				setError(error);
			}
		}
	}, [config, updateProgress, updateLoading, setError]);

	useEffect(() => {
		startLoader();
	}, [startLoader]);

	const columns = useMemo(() => {
		return getUpdateColumns(config);
	}, [config]);

	if (errorMessage) {
		return (
			<Box flexDirection="column">
				<Text bold color="red">
					{errorMessage}
				</Text>
			</Box>
		);
	}

	return (
		<LoaderBoundary loading={loading} text={loaderText}>
			<UpToDateBoundary enabled={!dependencies.length}>
				<Static>
					<Table data={dependencies} columns={columns} />
				</Static>
			</UpToDateBoundary>
		</LoaderBoundary>
	);
};

Update.propTypes = {
	config: PropTypes.shape({}).isRequired,
};

export default Update;
