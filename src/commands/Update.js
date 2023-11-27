import React, { useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import updateDependencies from '../common/updateDependencies';
import { mapDataToRows } from '../common/dependencies';
import { getUpdateColumns } from '../ui/columns';
import Table from '../ui/Table';
import Static from '../ui/Static';
import UpToDateBoundary from '../ui/UpToDateBoundary';
import LoaderBoundary from '../ui/LoaderBoundary';
import useDependencyLoader from '../ui/useDependencyLoader';

const Update = ({ config }) => {
	const [dependencies, setDependencies] = useState([]);
	const {
		loading,
		updateLoading,
		loaderText,
		updateProgress,
		showLoaderError,
	} = useDependencyLoader();

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
			if (!error.catch) {
				showLoaderError();
				throw error;
			}
		}
	}, [config, updateProgress, updateLoading, showLoaderError]);

	useEffect(() => {
		startLoader();
	}, [startLoader]);

	const columns = useMemo(() => {
		return getUpdateColumns(config);
	}, [config]);

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
