import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Box } from 'ink';

import LoaderBoundary from '../../ui/LoaderBoundary';
import useDependencyLoader from '../../ui/useDependencyLoader';
import UpToDateBoundary from '../../ui/UpToDateBoundary';
import { Wizard } from '../../ui/Wizard';

import { getPackages } from '../../common/packages';
import {
	getDependencyList,
	getDiffVersionParts,
	depTypesList,
} from '../../common/dependencies';

import DependencyStep from './DependencyStep';
import VersionStep from './VersionStep';
import PackagesStep from './PackagesStep';
import SummaryStep from './SummaryStep';
import EditStep from './EditStep';
import CompleteStep from './CompleteStep';

// import monorepoDeps from '../../../examples/monorepoDeps.json';
// import monorepoPackages from '../../../examples/monorepoPackages.json';

const Interactive = ({ config }) => {
	const { loading, setLoading, loaderText, setLoaderText, updateProgress } =
		useDependencyLoader();

	const [packages, setPackages] = useState({});
	const [dependencies, setDependencies] = useState([]);

	const [wizardState, setWizardState] = useState({
		// making the step controlled since ink doesn't batch state updates
		// and the states rendering separately causes flickering
		step: 0,
		updates: [],
		dependency: null,
		version: null,
	});

	const fetchPackagesAndDependencies = useCallback(async () => {
		const {
			rootPath,
			monorepo: isMonorepo,
			hoisted: isHoisted,
			concurrency,
			packageDirs,
			packages: filterByPackages,
			depTypes: filterByDepTypes,
		} = config;

		try {
			const packageList = await getPackages({
				rootPath,
				isMonorepo,
				packageDirs,
			});

			const dependencyList = await getDependencyList({
				packageList,
				filterByPackages,
				isHoisted,
				rootPath,
				filterByDepTypes,
				updateProgress,
				pMapOptions: {
					concurrency,
				},
			});

			const depOptions = dependencyList.reduce((acc, item) => {
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
						app,
						{
							installed: item.version.installed,
							target: item.versionRange.target,
							wildcard,
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
			depOptions.sort((a, b) => {
				if (a.name < b.name) {
					return -1;
				}
				if (a.name > b.name) {
					return 1;
				}
				return 0;
			});

			const packageOptions = Object.fromEntries(packageList);

			// setPackages(monorepoPackages);
			// setDependencies(monorepoDeps);

			setPackages(packageOptions);
			setDependencies(depOptions);
			setLoading(false);
		} catch (error) {
			setLoaderText('Error!');
			throw error;
		}
	}, [config, updateProgress, setLoading, setLoaderText]);

	const updateDependencies = async () => {
		const pkgsToUpdate = new Set();

		for (const update of wizardState.updates) {
			const dep = dependencies.find((d) => d.name === update.dependency);
			for (const pkgName of update.packages) {
				const pkg = packages[pkgName];
				const pkgDep = pkg.dependencies.get(update.dependency);
				const depType = depTypesList[pkgDep.type];
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
	};

	useEffect(() => {
		fetchPackagesAndDependencies();
	}, [fetchPackagesAndDependencies]);

	return (
		<LoaderBoundary loading={loading} text={loaderText}>
			<UpToDateBoundary enabled={!dependencies.length}>
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
							isMonorepo={config.monorepo}
						/>
						<PackagesStep
							dependencies={dependencies}
							wizardState={wizardState}
							packages={packages}
							setWizardState={setWizardState}
						/>
						<SummaryStep
							wizardState={wizardState}
							setWizardState={setWizardState}
							updateDependencies={updateDependencies}
							isMonorepo={config.monorepo}
						/>
						<EditStep
							wizardState={wizardState}
							setWizardState={setWizardState}
							isMonorepo={config.monorepo}
						/>
						<CompleteStep />
					</Wizard>
				</Box>
			</UpToDateBoundary>
		</LoaderBoundary>
	);
};

Interactive.propTypes = {
	config: PropTypes.shape({
		rootPath: PropTypes.string,
		monorepo: PropTypes.bool,
		hoisted: PropTypes.bool,
		concurrency: PropTypes.number,
		packages: PropTypes.arrayOf(PropTypes.string),
		packageDirs: PropTypes.arrayOf(PropTypes.string),
		depTypes: PropTypes.arrayOf(PropTypes.string),
	}).isRequired,
};

export default Interactive;
