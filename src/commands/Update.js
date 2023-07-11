import React, { useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text } from 'ink';
import updateDependencies from '../common/updateDependencies';
import { mapDataToRows } from '../common/dependencies';
import NameColumn from '../ui/NameColumn';
import UpgradeColumn from '../ui/UpgradeColumn';
import Table from '../ui/Table';
import Static from '../ui/Static';
import UpToDateBoundary from '../ui/UpToDateBoundary';
import LoaderBoundary from '../ui/LoaderBoundary';
import useDependencyLoader from '../ui/useDependencyLoader';

// get table columns based on the config
const getUpdateColumns = () => [
	{
		name: 'Name',
		accessor: 'name',
		Component: NameColumn,
		show: true,
	},
	{
		name: 'From',
		accessor: 'target',
		show: true,
		noWrap: true,
	},
	{
		name: '',
		accessor: '',
		Component: () => {
			return <Text>→</Text>;
		},
		show: true,
		noWrap: true,
	},
	{
		name: 'To',
		accessor: 'upgrade',
		Component: UpgradeColumn,
		show: true,
		noWrap: true,
	},
];

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
			const formattedData = mapDataToRows(dependenciesData);

			setDependencies(formattedData);
			updateLoading(false);
		} catch (error) {
			showLoaderError();
			throw error;
		}
	}, [config, updateProgress, updateLoading, showLoaderError]);

	useEffect(() => {
		startLoader();
	}, [startLoader]);

	const columns = useMemo(() => {
		const baseColumns = getUpdateColumns(config);
		return baseColumns.filter((c) => c.show);
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
