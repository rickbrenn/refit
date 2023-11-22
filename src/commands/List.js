import React, { useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Box, Text } from 'ink';
import { getListColumns } from '../ui/columns';
import Table, { getColumnsMinMax } from '../ui/Table';
import Static from '../ui/Static';
import useDependencyLoader from '../ui/useDependencyLoader';
import UpToDateBoundary from '../ui/UpToDateBoundary';
import LoaderBoundary from '../ui/LoaderBoundary';
import { mapDataToRows, sortDependencies } from '../common/dependencies';
import getDependencies from '../common/getDependencies';

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
			getColumnsMinMax({
				data: dependencies,
				columns,
			}),
		[columns, dependencies]
	);

	const dependencyTableData = useMemo(() => {
		// filter out deps with errors
		return dependencies.filter((d) =>
			config.all ? true : d.original.upgradable
		);
	}, [dependencies, config]);

	const errorTables = useMemo(() => {
		const errorColumns = getListColumns(config, false);
		const sortedDependencies = sortDependencies(dependencies, 'name');
		const errorData = errors.reduce((acc, curr) => {
			const data = sortedDependencies.filter((d) => d.original[curr.key]);
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

	const groupDependenciesByPackage = (deps) => {
		const groupedDependencies = deps.reduce((acc, curr) => {
			const { original } = curr;

			original.apps.forEach((app) => {
				if (!acc[app.name]) {
					acc[app.name] = [];
				}
				acc[app.name].push(curr);
			});

			return acc;
		}, {});

		return Object.entries(groupedDependencies);
	};

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

					{config.groupByPackage ? (
						groupDependenciesByPackage(dependencyTableData).map(
							([pkgName, pkgDeps]) => {
								return (
									<Box
										marginTop={1}
										display="flex"
										flexDirection="column"
										key={pkgDeps.key + pkgName}
									>
										<Text color="blue">{pkgName}</Text>
										<Table
											data={pkgDeps}
											columns={columns}
											maxColumnWidths={columnWidths.max}
										/>
									</Box>
								);
							}
						)
					) : (
						<Table
							data={dependencyTableData}
							columns={columns}
							maxColumnWidths={columnWidths.max}
						/>
					)}

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
		groupByPackage: PropTypes.bool,
	}).isRequired,
};

export default List;
