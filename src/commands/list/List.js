import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import NameColumn from '../../ui/NameColumn.js';
import UpgradeColumn from '../../ui/UpgradeColumn.js';
import Loader from '../../ui/Loader.js';
import Table from '../../ui/Table.js';
import Static from '../../ui/Static.js';
import useLoader from '../../ui/useLoader.js';
import getDependencies from '../../common/getDependencies.js';

// const fetchReleases = async (url) => {
// 	const testUrl = 'https://api.github.com/repos/tannerlinsley/react-table/releases';
// 	const response = await fetch(url);
// 	const resData = await response.json();

// 	const releases = resData.map((release) => release.name);
// 	console.log('latest release :>> ', resData[0]);
// };

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
	const [dependencies, setDependencies] = useState(null);
	const { updateProgress, loading, setLoading, loaderState, setLoaderState } =
		useLoader();

	// map the dependencies data to table row objects
	const mapDataToRows = (pkgs) => {
		return pkgs.map((p) => {
			// display version to upgrade to
			const upgradeVersion = p.upgradable && p.versionRange.latest;

			// if the dependency is not in node_modules display 'missing'
			const installedText = p.missing ? 'MISSING' : p.version?.installed;

			// how to display the list of dependencies
			const manyApps = p.apps.length > 1;
			const appsText = manyApps ? `${p.apps.length} Packages` : p.apps[0];

			return {
				name: p.name || '',
				target: p.versionRange?.target || '',
				installed: installedText || '',
				wanted: p.version?.wanted || '',
				latest: p.version?.latest || '',
				upgrade: upgradeVersion || '',
				type: p.type || '',
				hoisted: p.hoisted.toString() || '',
				in: appsText || '',
				color: p.color,
				upgradeParts: p.upgradeParts || {},
			};
		});
	};

	const fetchDependencies = useCallback(async () => {
		try {
			// get dependencies data
			const dependenciesData = await getDependencies(
				config,
				updateProgress
			);

			// format the data for the tab rows
			const formattedData = mapDataToRows(dependenciesData);

			setDependencies(formattedData);
			setLoading(false);
		} catch (error) {
			setLoaderState({
				text: 'Error!',
			});
			throw error;
		}
	}, [config, setLoaderState, setLoading, updateProgress]);

	useEffect(() => {
		fetchDependencies();
	}, [fetchDependencies]);

	const columns = useMemo(() => {
		const baseColumns = getListColumns(config);
		return baseColumns.filter((c) => c.show);
	}, [config]);

	if (loading) {
		return <Loader text={loaderState.text} />;
	}

	// TODO: maybe add a component that does the dep loading to share between this and update
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
