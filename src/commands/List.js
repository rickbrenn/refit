import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Text } from 'ink';
import NameColumn from '../ui/NameColumn';
import UpgradeColumn from '../ui/UpgradeColumn';
import Loader from '../ui/Loader';
import Table from '../ui/Table';
import Static from '../ui/Static';
import useLoader from '../ui/useLoader';
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
	const { startLoader, dependencies, loading, loaderState } = useLoader(
		getDependencies,
		config
	);

	useEffect(() => {
		startLoader();
	}, [startLoader]);

	const columns = useMemo(() => {
		const baseColumns = getListColumns(config);
		return baseColumns.filter((c) => c.show);
	}, [config]);

	if (loading) {
		return <Loader text={loaderState.text} />;
	}

	if (!dependencies.length) {
		return <Text color="green">All dependencies up to date</Text>;
	}

	return (
		<Static>
			<Table data={dependencies} columns={columns} />
		</Static>
	);
};

List.propTypes = {
	config: PropTypes.shape({}).isRequired,
};

export default List;
