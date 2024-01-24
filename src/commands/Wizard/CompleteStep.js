import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'ink';
import Table from '../../ui/Table';
import Static from '../../ui/Static';

const columns = [
	{
		name: 'Name',
		accessor: 'name',
	},
	{
		name: 'From',
		accessor: 'target',
		noWrap: true,
	},
	{
		name: '',
		accessor: '',
		Component: () => {
			return <Text>→</Text>;
		},
		noWrap: true,
	},
	{
		name: 'To',
		accessor: 'upgrade',
		noWrap: true,
	},
];

const CompleteStep = ({ data }) => {
	const tableData = data
		.map(({ dependency, version, wildcard, packages }) => {
			const fromVersions = [
				...new Set(
					packages.map(
						(pkg) =>
							dependency?.appVersions?.[pkg.name]?.target || '-'
					)
				),
			];

			return {
				name: dependency.name,
				target:
					fromVersions.length > 1
						? `${fromVersions.length} versions`
						: fromVersions[0],
				upgrade: wildcard + version,
				key: dependency.name,
			};
		})
		.filter(({ target, upgrade }) => target !== upgrade);

	if (tableData.length === 0) {
		return <Text>No packages to upgrade.</Text>;
	}

	return (
		<Static>
			<Table data={tableData} columns={columns} />
		</Static>
	);
};

CompleteStep.propTypes = {
	data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

export default CompleteStep;
