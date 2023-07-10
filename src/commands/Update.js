import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text } from 'ink';
import updateDependencies from '../common/updateDependencies';
import NameColumn from '../ui/NameColumn';
import UpgradeColumn from '../ui/UpgradeColumn';
import Table from '../ui/Table';
import Static from '../ui/Static';
import UpToDateBoundary from '../ui/UpToDateBoundary';
import LoaderBoundary from '../ui/LoaderBoundary';
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

	return (
		<LoaderBoundary loading={loading} text={loaderState.text}>
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
