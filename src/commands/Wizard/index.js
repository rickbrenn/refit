import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from 'ink';

import LoaderBoundary from '../../ui/LoaderBoundary';
import useDependencyLoader from '../../ui/useDependencyLoader';
import UpToDateBoundary from '../../ui/UpToDateBoundary';
import { Wizard } from '../../ui/Wizard';
import { useError } from '../../ui/ErrorBoundary';

import { getPackages } from '../../common/packages';
import {
	getDiffVersionParts,
	depTypesList,
	sortDependencies,
} from '../../common/dependencies';
import getDependencyList from '../../common/getDependencyList';

import DependencyStep from './DependencyStep';
import VersionStep from './VersionStep';
import PackagesStep from './PackagesStep';
import DependencyTypeStep from './DependencyTypeStep';
import SummaryStep from './SummaryStep';
import EditStep from './EditStep';
import CompleteStep from './CompleteStep';

const WizardCommand = ({ config }) => {
	const {
		loading,
		updateLoading,
		updateLoaderText,
		loaderText,
		updateProgress,
	} = useDependencyLoader();
	const { setError } = useError();

	const [packages, setPackages] = useState({});
	const [dependencies, setDependencies] = useState([]);

	// making the step controlled since ink doesn't batch state updates
	// and the states rendering separately causes flickering
	const wizardStateDefaults = {
		step: 0,
		updates: [],
		wildcard: '^',
		dependency: null,
		new: false,
		packages: null,
		version: null,
		errorMessage: null,
	};

	const [wizardState, setWizardState] = useState(wizardStateDefaults);

	const formatDependency = useCallback((dep) => {
		const {
			color,
			updateType,
			wildcard,
			midDot,
			uncoloredText,
			coloredText,
		} = getDiffVersionParts(
			dep.versionRange.target,
			dep.versionRange.latest,
			true
		);

		const appVersions = Object.fromEntries(
			dep.apps.map((app) => [
				app.name,
				{
					installed: dep.version.installed,
					target: dep.versionRange.target,
					wanted: dep.version.wanted,
					wildcard,
					type: app.type,
				},
			])
		);

		const versionData = {
			[dep.versionRange.target]: {
				color,
				updateType,
				wildcard,
				midDot,
				uncoloredText,
				coloredText,
			},
		};

		return {
			...dep,
			appVersions,
			versionData,
		};
	}, []);

	const fetchPackagesAndDependencies = useCallback(async () => {
		const {
			rootPath,
			workspaces,
			workspace: filterByPackages,
			depTypes: filterByDepTypes,
			packageManager,
			prerelease,
			deprecated,
		} = config;

		try {
			const packageList = await getPackages({
				rootPath,
				isMonorepo: !!workspaces?.length,
				workspaces,
			});

			const dependencyList = await getDependencyList({
				packageList,
				filterByPackages,
				rootPath,
				filterByDepTypes,
				updateProgress,
				allowPrerelease: prerelease,
				allowDeprecated: deprecated,
				packageManager,
			});

			let depOptions = dependencyList.reduce((acc, item) => {
				const existingDepIndex = acc.findIndex(
					({ name }) => name === item.name
				);

				const formattedDep = formatDependency(item);

				if (existingDepIndex > -1) {
					acc[existingDepIndex].appVersions = {
						...acc[existingDepIndex].appVersions,
						...formattedDep.appVersions,
					};

					acc[existingDepIndex].versionData = {
						...acc[existingDepIndex].versionData,
						...formattedDep.versionData,
					};
				} else {
					acc.push(formattedDep);
				}

				return acc;
			}, []);

			// sort alphabetically
			depOptions = sortDependencies(depOptions, 'name');

			const packageOptions = Object.fromEntries(packageList);

			setPackages(packageOptions);
			setDependencies(depOptions);
			updateLoading(false);
		} catch (error) {
			setError(error);
		}
	}, [config, updateProgress, updateLoading, setError, formatDependency]);

	const updateDependencies = async () => {
		try {
			const pkgsToUpdate = new Set();

			for (const update of wizardState.updates) {
				for (const {
					name: pkgName,
					type: pkgType,
				} of update.packages) {
					const pkg = packages[pkgName];
					const depType = depTypesList[pkgType];
					pkgsToUpdate.add(pkgName);
					pkg.pkgJsonInstance.update({
						[depType]: {
							...pkg.pkgJsonInstance.content[depType],
							[update.dependency.name]:
								update.wildcard + update.version,
						},
					});
				}
			}

			const pkgListArray = Array.from(pkgsToUpdate);

			await Promise.all(
				pkgListArray.map(async (pkgName) => {
					const pkg = packages[pkgName];
					return pkg.pkgJsonInstance.save();
				})
			);
		} catch (error) {
			setError(error);
		}
	};

	useEffect(() => {
		fetchPackagesAndDependencies();
	}, [fetchPackagesAndDependencies]);

	return (
		<LoaderBoundary loading={loading} text={loaderText}>
			<UpToDateBoundary enabled={!dependencies.length}>
				{wizardState.errorMessage && (
					<Box flexDirection="column" marginTop={1}>
						<Text bold color="red">
							{wizardState.errorMessage}
						</Text>
					</Box>
				)}
				<Box flexDirection="column" marginTop={1} marginBottom={1}>
					<Wizard controlledStep={wizardState.step}>
						<DependencyStep
							dependencies={dependencies}
							wizardState={wizardState}
							setWizardState={setWizardState}
							updateLoading={updateLoading}
							updateLoaderText={updateLoaderText}
							allowPrerelease={config.prerelease}
							allowDeprecated={config.deprecated}
							formatDependency={formatDependency}
						/>
						<VersionStep
							wizardState={wizardState}
							packages={packages}
							setWizardState={setWizardState}
							isMonorepo={!!config.workspaces?.length}
						/>
						<PackagesStep
							wizardState={wizardState}
							packages={packages}
							setWizardState={setWizardState}
						/>
						<DependencyTypeStep
							wizardState={wizardState}
							setWizardState={setWizardState}
						/>
						<SummaryStep
							wizardState={wizardState}
							setWizardState={setWizardState}
							updateDependencies={updateDependencies}
							wizardStateDefaults={wizardStateDefaults}
						/>
						<EditStep
							wizardState={wizardState}
							setWizardState={setWizardState}
						/>
						<CompleteStep data={wizardState.updates} />
					</Wizard>
				</Box>
			</UpToDateBoundary>
		</LoaderBoundary>
	);
};

WizardCommand.propTypes = {
	config: PropTypes.shape({
		rootPath: PropTypes.string,
		workspace: PropTypes.arrayOf(PropTypes.string),
		workspaces: PropTypes.arrayOf(PropTypes.string),
		depTypes: PropTypes.arrayOf(PropTypes.string),
		packageManager: PropTypes.string,
		prerelease: PropTypes.bool,
		deprecated: PropTypes.bool,
	}).isRequired,
};

export default WizardCommand;
