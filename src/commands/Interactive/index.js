import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from 'ink';

import Loader from '../../ui/Loader';
import { Wizard } from '../../ui/Wizard';

import { getRootPath } from '../../common/filesystem';
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
import CompleteStep from './CompleteStep';

/*
	NEXT:
	- clean up
	- test responsiveness / overflow / wrapping
	- go through TODOs in trello card
*/

const Interactive = ({ config }) => {
	const [loading, setLoading] = useState(true);
	const [loaderText, setLoaderText] = useState('Loading the truck..');

	const [packages, setPackages] = useState({});
	const [dependencies, setDependencies] = useState([]);

	const [wizardState, setWizardState] = useState({
		updates: [],
		dependency: null,
		version: null,
	});

	const updateProgress = useCallback(
		(progressCurrent, progressMax, packageName) => {
			const percentComplete = (progressCurrent * 100) / progressMax;
			const fixedPercent = percentComplete.toFixed();
			setLoaderText(
				`Delivering packages | ${fixedPercent}% | ${packageName}`
			);
		},
		[]
	);

	const fetchPackagesAndDependencies = useCallback(async () => {
		const {
			rootDir,
			filterByPackages,
			packageDirs,
			isMonorepo,
			isHoisted,
			// showAll,
			sortAlphabetical,
			concurrency,
			filterByDeps,
			filterByDepTypes,
			// filterByUpdateTypes,
		} = config;

		try {
			// TODO: root path should prob be in the config
			const rootPath = getRootPath(rootDir);

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
				filterByDeps,
				filterByDepTypes,
				updateProgress,
				pMapOptions: {
					concurrency,
				},
				sortAlphabetical,
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

				const versionData = item.upgradable
					? {
							[item.versionRange.target]: {
								color,
								updateType,
								wildcard,
								midDot,
								uncoloredText,
								coloredText,
							},
					  }
					: {};

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

			setPackages(packageOptions);
			setDependencies(depOptions);
			setLoading(false);
		} catch (error) {
			setLoaderText('Error!');
			throw error;
		}
	}, [config, updateProgress]);

	const updateDependencies = async () => {
		// console.log(wizardState.updates);

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

	if (loading) {
		return <Loader text={loaderText} />;
	}

	if (!dependencies.length) {
		return <Text color="green">All dependencies up to date</Text>;
	}

	return (
		<Box flexDirection="column" marginTop={1} marginBottom={1}>
			<Wizard>
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
					isMonorepo={config.isMonorepo}
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
					isMonorepo={config.isMonorepo}
				/>
				<CompleteStep />
			</Wizard>
		</Box>
	);
};

Interactive.propTypes = {
	config: PropTypes.shape({
		rootDir: PropTypes.string,
		filterByPackages: PropTypes.arrayOf(PropTypes.string),
		packageDirs: PropTypes.arrayOf(PropTypes.string),
		isMonorepo: PropTypes.bool,
		isHoisted: PropTypes.bool,
		sortAlphabetical: PropTypes.bool,
		concurrency: PropTypes.number,
		filterByDeps: PropTypes.arrayOf(PropTypes.string),
		filterByDepTypes: PropTypes.arrayOf(PropTypes.string),
	}).isRequired,
};

export default Interactive;