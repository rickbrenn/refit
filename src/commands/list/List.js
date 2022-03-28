import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import NameColumn from './NameColumn.js';
import UpgradeColumn from './UpgradeColumn.js';
import Loader from '../../ui/Loader.js';
import Table from '../../ui/Table.js';
import getPackages from '../../common/getPackages.js';

// const fetchReleases = async (url) => {
// 	const testUrl = 'https://api.github.com/repos/tannerlinsley/react-table/releases';
// 	const response = await fetch(url);
// 	const resData = await response.json();

// 	const releases = resData.map((release) => release.name);
// 	console.log('latest release :>> ', resData[0]);
// };

const List = ({ config }) => {
	const [packages, setPackages] = useState(null);
	const [loading, setLoading] = useState(true);
	const [loaderState, setLoaderState] = useState({
		text: 'Loading the truck..',
	});

	// function called for each package that is processed in getPackages
	const updateProgress = (progressCurrent, progressMax, packageName) => {
		const percentComplete = (progressCurrent * 100) / progressMax;
		const fixedPercent = percentComplete.toFixed();

		setLoaderState({
			text: `Delivering packages | ${fixedPercent}% | ${packageName}`,
		});
	};

	// get table columns based on the config
	const getListColumns = ({ allColumns, monorepo }) => [
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
			show: allColumns,
			noWrap: true,
		},
		{
			name: 'Latest',
			accessor: 'latest',
			show: allColumns,
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
			show: allColumns,
			wrap: 'truncate',
		},
		{
			name: 'Hoisted',
			accessor: 'hoisted',
			show: allColumns && monorepo,
			wrap: 'truncate',
		},
		{
			name: 'In',
			accessor: 'in',
			show: allColumns && monorepo,
			wrap: 'truncate',
		},
	];

	// map the packages data to table row objects
	const mapDataToRows = (pkgs) => {
		return pkgs.map((p) => {
			// display version to upgrade to
			const upgradeVersion = p.upgradable && p.versionRange.latest;

			// if the package is not in node_modules display 'missing'
			const installedText = p.missing ? 'MISSING' : p.version?.installed;

			// how to display the list of packages
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

	const fetchPackages = useCallback(async () => {
		try {
			// get packages data
			const packagesData = await getPackages(config, updateProgress);

			// format the data for the tab rows
			const formattedData = mapDataToRows(packagesData);

			setPackages(formattedData);
			setLoading(false);
		} catch (error) {
			setLoaderState({
				text: 'Error!',
			});
			throw error;
		}
	}, [config]);

	useEffect(() => {
		fetchPackages();
	}, [fetchPackages]);

	const columns = useMemo(() => {
		const baseColumns = getListColumns(config);
		return baseColumns.filter((c) => c.show);
	}, [config]);

	if (loading) {
		return <Loader text={loaderState.text} />;
	}

	return <Table data={packages} columns={columns} />;
};

List.propTypes = {
	config: PropTypes.shape({}).isRequired,
};

export default List;
