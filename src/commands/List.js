import React, { useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import NameColumn from '../ui/NameColumn';
import UpgradeColumn from '../ui/UpgradeColumn';
import Table from '../ui/Table';
import Static from '../ui/Static';
import useDependencyLoader from '../ui/useDependencyLoader';
import UpToDateBoundary from '../ui/UpToDateBoundary';
import LoaderBoundary from '../ui/LoaderBoundary';
import { mapDataToRows } from '../common/dependencies';
import getDependencies from '../common/getDependencies';

// get table columns based on the config
const getListColumns = ({ verbose, monorepo }) => [
	{
		name: 'Name',
		accessor: 'name',
		Component: NameColumn,
		show: true,
	},
	{
		name: 'Target',
		accessor: 'target',
		show: true,
		noWrap: true,
	},
	{
		name: 'Installed',
		accessor: 'installed',
		show: true,
		noWrap: true,
	},
	{
		name: 'Wanted',
		accessor: 'wanted',
		show: verbose,
		noWrap: true,
	},
	{
		name: 'Latest',
		accessor: 'latest',
		show: verbose,
		noWrap: true,
	},
	{
		name: 'Upgrade',
		accessor: 'upgrade',
		Component: UpgradeColumn,
		show: true,
		noWrap: true,
	},
	{
		name: 'Type',
		accessor: 'type',
		show: verbose,
		wrap: 'truncate',
	},
	{
		name: 'Hoisted',
		accessor: 'hoisted',
		show: verbose && monorepo,
		wrap: 'truncate',
	},
	{
		name: 'In',
		accessor: 'in',
		show: verbose && monorepo,
		wrap: 'truncate',
	},
];

const List = ({ config }) => {
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
			const dependenciesData = await getDependencies(
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
		const baseColumns = getListColumns(config);
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

List.propTypes = {
	config: PropTypes.shape({}).isRequired,
};

export default List;
