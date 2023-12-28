import React, { useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box, useFocusManager } from 'ink';
import getDependencies from '../common/getDependencies';
import { mapDataToRows, depTypesList } from '../common/dependencies';
import { getPackages } from '../common/packages';
import { getListColumns, getUpdateColumns } from '../ui/columns';
import Table from '../ui/Table';
import Static from '../ui/Static';
import CheckSelectorTable from '../ui/CheckSelectorTable';
import UpToDateBoundary from '../ui/UpToDateBoundary';
import LoaderBoundary from '../ui/LoaderBoundary';
import useDependencyLoader from '../ui/useDependencyLoader';
import FocusTarget from '../ui/FocusTarget';
import Changelog from '../ui/Changelog/Changelog';
import useTerminalSize from '../ui/useTerminalSize';
import { useError } from '../ui/ErrorBoundary';

const InteractiveUpdate = ({ config }) => {
	const [step, setStep] = useState(0);
	const [updates, setUpdates] = useState([]);
	const [dependencies, setDependencies] = useState([]);
	const [changelog, setChangelog] = useState({
		open: false,
		name: null,
		version: null,
	});
	const [errorMessage, setErrorMessage] = useState('');
	const { focus } = useFocusManager();
	const { loading, updateLoading, loaderText, updateProgress, interactive } =
		useDependencyLoader();
	const { height } = useTerminalSize();
	const { setError } = useError();

	const startLoader = useCallback(async () => {
		try {
			// get dependencies data
			const dependenciesData = await getDependencies(
				{
					...config,
					noIssues: true,
				},
				updateProgress
			);

			setDependencies(mapDataToRows(dependenciesData, config));
			updateLoading(false);
		} catch (error) {
			if (error.catch) {
				setErrorMessage(error.message);
				updateLoading(false);
			} else {
				setError(error);
			}
		}
	}, [config, updateProgress, updateLoading, setError]);

	useEffect(() => {
		startLoader();
	}, [startLoader, interactive]);

	const listColumns = useMemo(() => {
		return getListColumns(config);
	}, [config]);

	const updateColumns = useMemo(() => {
		return getUpdateColumns(config);
	}, [config]);

	const updateDependencies = async (selectedDeps) => {
		const pkgs = await getPackages(config);

		const pkgsToUpdate = new Set();
		for (const { name, original } of selectedDeps) {
			for (const app of original.apps) {
				const pkg = pkgs.get(app.name);
				const pkgDep = pkg.dependencies.get(name);
				const depType = depTypesList[pkgDep.type];
				pkgsToUpdate.add(app.name);
				pkg.pkgJsonInstance.update({
					[depType]: {
						...pkg.pkgJsonInstance.content[depType],
						[name]: original.versionRange[config.updateTo],
					},
				});
			}
		}

		const pkgListArray = Array.from(pkgsToUpdate);

		await Promise.all(
			pkgListArray.map(async (pkgName) => {
				const pkg = pkgs.get(pkgName);
				return pkg.pkgJsonInstance.save();
			})
		);
	};

	const handleSelect = async (selectedDeps) => {
		await updateDependencies(selectedDeps);
		setUpdates(selectedDeps);
		setStep(1);
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
				{step === 0 && (
					<>
						<FocusTarget
							active={!changelog.open}
							id="selector"
							autoFocus
						>
							{(isFocused) => {
								return (
									<Box flexDirection="column" marginTop={1}>
										<Box>
											<Box marginRight="1">
												<Text>
													Select a package below
												</Text>
											</Box>
											<Box>
												<Text color="grey">(</Text>
												<Text color="magenta">
													{'<space>'}
												</Text>
												<Text color="grey">
													{' to select, '}
												</Text>
												<Text color="magenta">
													{'<a>'}
												</Text>
												<Text color="grey">
													{' to select all, '}
												</Text>
												<Text color="magenta">
													{'<tab>'}
												</Text>
												<Text color="grey">
													{' to view changelog)'}
												</Text>
											</Box>
										</Box>
										<CheckSelectorTable
											columns={listColumns}
											data={dependencies}
											onSelect={handleSelect}
											itemKey="key"
											labelKey="name"
											limit={height - 6}
											inputHandler={(
												{ key },
												{ item }
											) => {
												if (key.tab) {
													setChangelog({
														open: true,
														name: item.name,
														version: item.installed,
													});
													focus('changelog');
												}
											}}
											isFocused={isFocused}
										/>
									</Box>
								);
							}}
						</FocusTarget>
						<FocusTarget
							active={changelog.open}
							id="changelog"
							keepRendered={false}
						>
							{(isFocused) => {
								return (
									<Changelog
										open={changelog.open}
										name={changelog.name}
										version={changelog.version}
										onExit={() => {
											setChangelog({
												open: false,
												name: null,
												version: null,
											});
											focus('selector');
										}}
										exitKey={(input, key) => key.tab}
										exitKeyLabel="tab"
										exitText="back"
										isFocused={isFocused}
										showExitOnFallback
									/>
								);
							}}
						</FocusTarget>
					</>
				)}
				{step === 1 && (
					<Static>
						<Table data={updates} columns={updateColumns} />
					</Static>
				)}
			</UpToDateBoundary>
		</LoaderBoundary>
	);
};

InteractiveUpdate.propTypes = {
	config: PropTypes.shape({
		updateTo: PropTypes.string,
	}).isRequired,
};

export default InteractiveUpdate;
