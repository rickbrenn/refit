import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Text } from 'ink';
import Loader from '../ui/Loader';
import updateDependencies from '../common/updateDependencies';
import NameColumn from '../ui/NameColumn';
import UpgradeColumn from '../ui/UpgradeColumn';
import Table from '../ui/Table';
import Static from '../ui/Static';
import useLoader from '../ui/useLoader';

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
	const { startLoader, dependencies, loading, loaderState } = useLoader(
		updateDependencies,
		config
	);

	useEffect(() => {
		startLoader();
	}, [startLoader]);

	const columns = useMemo(() => {
		const baseColumns = getUpdateColumns(config);
		return baseColumns.filter((c) => c.show);
	}, [config]);

	if (loading) {
		return <Loader text={loaderState.text} />;
	}

	if (!dependencies.length) {
		return <Text color="green">No dependencies need updated</Text>;
	}

	return (
		<Static>
			<Table data={dependencies} columns={columns} />
		</Static>
	);
};

Update.propTypes = {
	config: PropTypes.shape({}).isRequired,
};

export default Update;
