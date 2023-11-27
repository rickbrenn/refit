import React, { useEffect, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
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

const InteractiveUpdate = ({ config }) => {
	const [step, setStep] = useState(0);
	const [updates, setUpdates] = useState([]);
	const [dependencies, setDependencies] = useState([]);
	const {
		loading,
		updateLoading,
		loaderText,
		updateProgress,
		showLoaderError,
		interactive,
	} = useDependencyLoader();

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
			if (!error.catch) {
				showLoaderError();
				throw error;
			}
		}
	}, [config, updateProgress, updateLoading, showLoaderError]);

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

	return (
		<LoaderBoundary loading={loading} text={loaderText}>
			<UpToDateBoundary enabled={!dependencies.length}>
				{step === 0 && (
					<CheckSelectorTable
						columns={listColumns}
						data={dependencies}
						onSelect={handleSelect}
						itemKey="key"
						labelKey="name"
					/>
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
