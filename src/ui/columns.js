import React from 'react';
import { Text } from 'ink';
import NameColumn from './NameColumn';
import UpgradeColumn from './UpgradeColumn';

// get list table columns based on the config
const getListColumns = ({ verbose, workspaces, global }, showColor = true) => {
	const columns = [
		{
			name: 'Name',
			accessor: 'name',
			Component: NameColumn,
			show: true,
			showColor,
		},
		{
			name: 'Target',
			accessor: 'target',
			show: !global,
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
			showColor,
		},
		{
			name: 'Last Updated',
			accessor: 'lastPublishedAt',
			show: verbose,
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
			show: verbose && workspaces?.length,
			wrap: 'truncate',
		},
		{
			name: 'In',
			accessor: 'in',
			show: workspaces?.length && !global,
			wrap: 'truncate',
		},
	];

	return columns.filter((c) => c.show);
};

// get update table columns based on the config
const getUpdateColumns = () => {
	const columns = [
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

	return columns.filter((c) => c.show);
};

export { getListColumns, getUpdateColumns };
