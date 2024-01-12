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
	const { loading, updateLoading, loaderText, updateProgress } =
		useDependencyLoader();
	const { setError } = useError();

	const [packages, setPackages] = useState({});
	const [dependencies, setDependencies] = useState([]);

	const [wizardState, setWizardState] = useState({
		// making the step controlled since ink doesn't batch state updates
		// and the states rendering separately causes flickering
		step: 0,
		updates: [],
		dependency: null,
		packages: null,
		version: null,
		errorMessage: null,
	});

	const fetchPackagesAndDependencies = useCallback(async () => {
		const {
			rootPath,
			packageDirs,
			packages: filterByPackages,
			depTypes: filterByDepTypes,
			packageManager,
			prerelease,
			deprecated,
		} = config;

		try {
			const packageList = await getPackages({
				rootPath,
				isMonorepo: !!packageDirs?.length,
				packageDirs,
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

				const {
					color,
					updateType,
					wildcard,
					midDot,
					uncoloredText,
					coloredText,
				} = getDiffVersionParts(
					item.versionRange.target,
					item.versionRange.latest,
					true
				);

				const appVersions = Object.fromEntries(
					item.apps.map((app) => [
						app.name,
						{
							installed: item.version.installed,
							target: item.versionRange.target,
							wanted: item.version.wanted,
							wildcard,
							type: app.type,
						},
					])
				);

				const versionData = {
					[item.versionRange.target]: {
						color,
						updateType,
						wildcard,
						midDot,
						uncoloredText,
						coloredText,
					},
				};

				if (existingDepIndex > -1) {
					acc[existingDepIndex].apps = {
						...acc[existingDepIndex].apps,
						...appVersions,
					};

					acc[existingDepIndex].versionData = {
						...acc[existingDepIndex].versionData,
						...versionData,
					};
				} else {
					acc.push({
						name: item.name,
						versions: item.versions,
						distTags: item.distTags,
						apps: appVersions,
						upgradable: item.upgradable,
						latestRange: item.versionRange.latest,
						versionData,
					});
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
	}, [config, updateProgress, updateLoading, setError]);

	const updateDependencies = async () => {
		try {
			const pkgsToUpdate = new Set();

			for (const update of wizardState.updates) {
				const dep = dependencies.find(
					(d) => d.name === update.dependency
				);
				for (const {
					name: pkgName,
					type: pkgType,
				} of update.packages) {
					const pkg = packages[pkgName];
					const depType = depTypesList[pkgType];
					// TODO: add wildcard selection step?
					const { wildcard } = dep.apps[pkgName] || {};
					const depWildcard = wildcard === undefined ? '^' : wildcard;
					pkgsToUpdate.add(pkgName);
					pkg.pkgJsonInstance.update({
						[depType]: {
							...pkg.pkgJsonInstance.content[depType],
							[update.dependency]: depWildcard + update.version,
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
						/>
						<VersionStep
							dependencies={dependencies}
							wizardState={wizardState}
							packages={packages}
							setWizardState={setWizardState}
							isMonorepo={!!config.packageDirs?.length}
							allowPrerelease={config.prerelease}
							allowDeprecated={config.deprecated}
						/>
						<PackagesStep
							dependencies={dependencies}
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
						/>
						<EditStep
							wizardState={wizardState}
							setWizardState={setWizardState}
						/>
						<CompleteStep />
					</Wizard>
				</Box>
			</UpToDateBoundary>
		</LoaderBoundary>
	);
};

WizardCommand.propTypes = {
	config: PropTypes.shape({
		rootPath: PropTypes.string,
		packages: PropTypes.arrayOf(PropTypes.string),
		packageDirs: PropTypes.arrayOf(PropTypes.string),
		depTypes: PropTypes.arrayOf(PropTypes.string),
		packageManager: PropTypes.string,
		prerelease: PropTypes.bool,
		deprecated: PropTypes.bool,
	}).isRequired,
};

export default WizardCommand;
