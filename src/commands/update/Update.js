import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Text } from 'ink';
import Loader from '../../ui/Loader.js';
import updateDependencies from '../../common/updateDependencies.js';
import NameColumn from '../../ui/NameColumn.js';
import UpgradeColumn from '../../ui/UpgradeColumn.js';
import Table from '../../ui/Table.js';
import Static from '../../ui/Static.js';

// get table columns based on the config
const getListColumns = () => [
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
	const [dependencies, setDependencies] = useState(null);
	const [loading, setLoading] = useState(true);
	const [loaderState, setLoaderState] = useState({
		text: 'Loading the truck..',
	});

	// TODO: move to common place to share with List
	// function called for each dependency that is processed in getDependencies
	const updateProgress = (progressCurrent, progressMax, packageName) => {
		const percentComplete = (progressCurrent * 100) / progressMax;
		const fixedPercent = percentComplete.toFixed();

		setLoaderState({
			text: `Delivering packages | ${fixedPercent}% | ${packageName}`,
		});
	};

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

	const fetchAndUpdateDependencies = useCallback(async () => {
		try {
			const dependenciesData = await updateDependencies(
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
	}, [config]);

	useEffect(() => {
		fetchAndUpdateDependencies();
	}, [fetchAndUpdateDependencies]);

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

Update.propTypes = {
	config: PropTypes.shape({}).isRequired,
};

export default Update;
