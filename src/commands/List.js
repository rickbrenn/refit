import React, { useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Box, Text } from 'ink';
import NameColumn from '../ui/NameColumn';
import UpgradeColumn from '../ui/UpgradeColumn';
import Table, { calculateColumnWidths } from '../ui/Table';
import Static from '../ui/Static';
import useDependencyLoader from '../ui/useDependencyLoader';
import UpToDateBoundary from '../ui/UpToDateBoundary';
import LoaderBoundary from '../ui/LoaderBoundary';
import { mapDataToRows, sortDependencies } from '../common/dependencies';
import getDependencies from '../common/getDependencies';

// get table columns based on the config
const getListColumns = (
	{ verbose, packageDirs, hoisted, global },
	showColor = true
) => {
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
			show: verbose && packageDirs?.length && hoisted,
			wrap: 'truncate',
		},
		{
			name: 'In',
			accessor: 'in',
			show: packageDirs?.length && !global,
			wrap: 'truncate',
		},
	];

	return columns.filter((c) => c.show);
};

const errors = [
	{
		key: 'multipleTargets',
		color: 'yellow',
		message: 'dependencies with multiple target versions',
	},
	{
		key: 'installNeeded',
		color: 'red',
		message: 'dependencies requiring install',
	},
	{
		key: 'notOnRegistry',
		color: 'red',
		message: 'dependencies missing from the registry',
	},
	{
		key: 'deprecated',
		color: 'red',
		message: 'dependencies that are deprecated',
	},
];

const List = ({ config }) => {
	const [dependencies, setDependencies] = useState([]);
	const [errorMessage, setErrorMessage] = useState('');
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

			setDependencies(mapDataToRows(dependenciesData));
			updateLoading(false);
		} catch (error) {
			if (!error.catch) {
				showLoaderError();
				throw error;
			}

			setErrorMessage(error.message);
			updateLoading(false);
		}
	}, [config, updateProgress, updateLoading, showLoaderError]);

	useEffect(() => {
		startLoader();
	}, [startLoader]);

	const columns = useMemo(() => {
		return getListColumns(config);
	}, [config]);

	const columnWidths = useMemo(
		() =>
			calculateColumnWidths({
				data: dependencies,
				columns,
			}),
		[columns, dependencies]
	);

	const dependencyTableData = useMemo(() => {
		// filter out deps with errors
		return dependencies.filter((d) => (config.all ? true : d.upgradable));
	}, [dependencies, config]);

	const errorTables = useMemo(() => {
		const errorColumns = getListColumns(config, false);
		const sortedDependencies = sortDependencies(dependencies, 'name');
		const errorData = errors.reduce((acc, curr) => {
			const data = sortedDependencies.filter((d) => d.errors[curr.key]);
			if (data.length) {
				acc.push({
					...curr,
					data,
				});
			}
			return acc;
		}, []);

		return errorData.map((error) => {
			return (
				<Box key={error.key} flexDirection="column">
					<Text color={error.color}>{error.message}</Text>
					<Table
						data={error.data}
						columns={errorColumns}
						borderColor={error.color}
						maxColumnWidths={columnWidths.max}
					/>
				</Box>
			);
		});
	}, [config, dependencies, columnWidths]);

	if (errorMessage) {
		return (
			<Box flexDirection="column">
				<Text bold color="red">
					{errorMessage}
				</Text>
			</Box>
		);
	}

	return (
		<LoaderBoundary loading={loading} text={loaderText}>
			<UpToDateBoundary enabled={!dependencies.length}>
				<Static>
					{config.global && (
						<Box marginTop={1}>
							<Text>globally installed with </Text>
							<Text color="blue">{config.packageManager}</Text>
						</Box>
					)}
					<Table
						data={dependencyTableData}
						columns={columns}
						maxColumnWidths={columnWidths.max}
					/>

					{errorTables.length > 0 && (
						<Box flexDirection="column" marginTop={1}>
							<Box>
								<Text bold>Issues Detected:</Text>
							</Box>

							{errorTables}

							{dependencies.some((d) => d.installNeeded) && (
								<Box>
									<Text>Run </Text>
									<Text color="blue">{`${config.packageManager} install `}</Text>
									<Text>
										to resolve some dependency issues
									</Text>
								</Box>
							)}
						</Box>
					)}
				</Static>
			</UpToDateBoundary>
		</LoaderBoundary>
	);
};

List.propTypes = {
	config: PropTypes.shape({
		packageManager: PropTypes.string,
		all: PropTypes.bool,
		global: PropTypes.bool,
	}).isRequired,
};

export default List;
