import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';

import Loader from '../ui/Loader';
import { Selector, CheckSelector } from '../ui/Selector';

import { getRootPath } from '../common/filesystem';
import { getPackages } from '../common/packages';
import {
	getDependencyList,
	getDiffVersionParts,
	depTypesList,
} from '../common/dependencies';

/*
	NEXT:
	- add version prefix to version selector
	- clean up
	- go through TODOs in trello card
*/

const Wizard = ({ config }) => {
	const [loading, setLoading] = useState(true);
	const [loaderText, setLoaderText] = useState('Loading the truck..');

	const [packages, setPackages] = useState({});
	const [dependencies, setDependencies] = useState([]);

	const [wizardState, setWizardState] = useState({
		step: 0,
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

			// remove duplicates and format data
			// const depOptions = dependencyList.reduce((acc, item) => {
			// 	const existingDepIndex = acc.findIndex(
			// 		({ name }) => name === item.name
			// 	);
			// 	console.log('existingDepIndex :>> ', existingDepIndex);

			// 	const appVersions = item.apps.map((app) => ({
			// 		name: app.name,
			// 		version: item.version.installed,
			// 	}));

			// 	if (existingDepIndex > -1) {
			// 		acc[existingDepIndex].apps = [
			// 			...acc[existingDepIndex].apps,
			// 			...appVersions,
			// 		];
			// 	} else {
			// 		acc.push({
			// 			name: item.name,
			// 			versions: item.versions,
			// 			distTags: item.distTags,
			// 			apps: appVersions,
			// 		});
			// 	}

			// 	return acc;
			// }, []);

			const depOptions = dependencyList.reduce((acc, item) => {
				const existingDepIndex = acc.findIndex(
					({ name }) => name === item.name
				);

				const appVersions = Object.fromEntries(
					item.apps.map((app) => [
						app,
						{
							installed: item.version.installed,
							target: item.versionRange.target,
						},
					])
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
			for (const pkgName of update.packages) {
				const pkg = packages[pkgName];
				const pkgDep = pkg.dependencies.get(update.dependency);
				const depType = depTypesList[pkgDep.type];
				pkgsToUpdate.add(pkgName);
				pkg.pkgJsonInstance.update({
					[depType]: {
						...pkg.pkgJsonInstance.content[depType],
						[update.dependency]: update.version,
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

		setWizardState((prevState) => ({
			...prevState,
			version: null,
			dependency: null,
			step: 5,
		}));
	};

	const handleDependencySelect = (value) => {
		setWizardState((prevState) => ({
			...prevState,
			dependency: value.name,
			step: 1,
		}));
	};

	const handleVersionSelect = (value) => {
		setWizardState((prevState) => ({
			...prevState,
			version: value.version,
			step: 2,
		}));
	};

	const handlePackageSelect = (value) => {
		setWizardState((prevState) => ({
			...prevState,
			updates: [
				...prevState.updates,
				{
					dependency: prevState.dependency,
					version: prevState.version,
					packages: value,
				},
			],
			step: 3,
		}));
	};

	const handleFinalStep = (value) => {
		if (value === 'Done') {
			updateDependencies();
		}

		if (value === 'Edit updates') {
			setWizardState((prevState) => ({
				...prevState,
				version: null,
				dependency: null,
				step: 4,
			}));
		}

		if (value === 'Add another') {
			setWizardState((prevState) => ({
				...prevState,
				version: null,
				dependency: null,
				step: 0,
			}));
		}
	};

	const handleRemoveUpdate = (value) => {
		setWizardState((prevState) => {
			const updates = prevState.updates.filter(
				(_, index) => index !== value.index
			);
			return {
				...prevState,
				updates,
				step: updates.length ? 3 : 0,
			};
		});
	};

	useEffect(() => {
		fetchPackagesAndDependencies();
	}, [fetchPackagesAndDependencies]);

	const versionOptions = useMemo(() => {
		const dep = dependencies.find((d) => d.name === wizardState.dependency);
		const { versions = [], distTags = {}, apps = {} } = dep || {};

		const sortedVersions = [...versions].reverse();

		const options = [];

		for (const [distTag, version] of Object.entries(distTags)) {
			options.push({
				version,
				distTag,
				apps: Object.keys(apps).filter(
					(app) => apps[app].installed === version
				),
			});
		}

		const versionsToExclude = Object.values(distTags);
		for (const version of sortedVersions) {
			if (!versionsToExclude.includes(version)) {
				options.push({
					version,
					distTag: null,
					apps: Object.keys(apps).filter(
						(app) => apps[app].installed === version
					),
				});
			}
		}

		return options;
	}, [wizardState?.dependency, dependencies]);

	const renderDependencyItem = (item, highlighted, selected, textColor) => {
		const installedVersions = Object.values(item.versionData);

		const coloredVersionsComponent = installedVersions.reduce(
			(acc, curr) => {
				const { color, wildcard, midDot, uncoloredText, coloredText } =
					curr;

				const versionKey = item.name + uncoloredText + coloredText;
				const versionComp = (
					<Text key={versionKey}>
						{wildcard + uncoloredText + midDot}
						<Text color={color}>{coloredText}</Text>
					</Text>
				);

				const delimiterKey = `${versionKey}delimiter`;
				const delimiter = <Text key={delimiterKey}>, </Text>;

				if (acc === null) {
					return [versionComp];
				}

				return [...acc, delimiter, versionComp];
			},
			null
		);

		return (
			<Box>
				<Box marginRight={1}>
					<Text color={textColor}>{item.name}</Text>
				</Box>
				{item.upgradable && (
					<Box>
						<Box marginRight={1}>
							<Text>(</Text>
							{coloredVersionsComponent}
						</Box>
						<Box marginRight={1}>
							<Text>{`->`}</Text>
						</Box>
						<Box>
							<Text>{item.latestRange}</Text>
							<Text>)</Text>
						</Box>
					</Box>
				)}
			</Box>
		);
	};

	if (loading) {
		return <Loader text={loaderText} />;
	}

	if (!dependencies.length) {
		return <Text color="green">All dependencies up to date</Text>;
	}

	const steps = [
		{
			title: 'Selected Dependency:',
			value: wizardState?.dependency?.name,
			component: (
				<Selector
					items={dependencies.filter(
						(dep) =>
							!wizardState.updates.some(
								(update) => update.dependency === dep.name
							)
					)}
					onSelect={handleDependencySelect}
					limit={8}
					labelKey="name"
					title="Select a package below to add or update"
					searchable
					creatable
					searchByKey="name"
					renderItem={renderDependencyItem}
				/>
			),
		},
		{
			title: 'Selected Version:',
			value: wizardState?.version?.version,
			component: (
				<Selector
					items={versionOptions}
					onSelect={handleVersionSelect}
					limit={8}
					labelKey="version"
					title="Select a version below to install"
					searchable
					searchByKey="version"
					renderItem={(item, highlighted, selected, textColor) => {
						// console.log('item :>> ', item);

						return (
							<Box>
								<Box marginRight={1}>
									<Text color={textColor}>
										{item.version}
									</Text>
								</Box>
								{item.distTag && (
									<Box marginRight={1}>
										<Text color="green">{`#${item.distTag}`}</Text>
									</Box>
								)}
								{item.apps.length > 0 && (
									<Box>
										<Text color="green">
											{config.isMonorepo
												? `(${item.apps.join(', ')})`
												: '(installed)'}
										</Text>
									</Box>
								)}
							</Box>
						);
					}}
				/>
			),
		},
		{
			// show: config.isMonorepo,
			component: (
				<CheckSelector
					items={Object.keys(packages)}
					onSelect={handlePackageSelect}
					limit={8}
					title="Select a package below"
				/>
			),
		},
		{
			showProgress: false,
			component: (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text>Summary:</Text>
					</Box>
					<Box marginLeft={1} marginBottom={1} flexDirection="column">
						{wizardState.updates.map((update) => {
							return (
								<Box key={update.dependency}>
									<Box marginRight={1}>
										<Text>{`${update.dependency}@${update.version}`}</Text>
									</Box>
									{
										/* config.isMonorepo */ true && (
											<Text>{`(${update.packages.join(
												', '
											)})`}</Text>
										)
									}
								</Box>
							);
						})}
					</Box>
					<Selector
						items={['Add another', 'Edit updates', 'Done']}
						onSelect={handleFinalStep}
					/>
				</Box>
			),
		},
		{
			showProgress: false,
			component: (
				<Selector
					items={wizardState.updates.map((u, i) => ({
						...u,
						name: u.dependency,
						index: i,
					}))}
					onSelect={handleRemoveUpdate}
					limit={8}
					labelKey="name"
					title="Select updates to remove"
					renderHighlighter={(item, highlighted) => {
						return (
							<Text color="red">{highlighted ? 'X' : ' '}</Text>
						);
					}}
					renderItem={(item) => {
						const value = `${item.dependency}@${item.version}`;
						return (
							<Box key={value}>
								<Box marginRight={1}>
									<Text>{value}</Text>
								</Box>
								{
									/* config.isMonorepo */ true && (
										<Text>{`(${item.packages.join(
											', '
										)})`}</Text>
									)
								}
							</Box>
						);
					}}
				/>
			),
		},
		{
			component: (
				<Box>
					<Text>Done</Text>
				</Box>
			),
		},
	].filter((p) => p.show !== false);

	const { component, showProgress } = steps[wizardState.step];

	return (
		<Box flexDirection="column" marginTop={1} marginBottom={1}>
			{showProgress !== false && (
				<Box
					flexDirection="column"
					marginBottom={steps.some(({ value }) => !!value) ? 1 : 0}
				>
					{steps.map((result) => {
						return result.value ? (
							<Box flexDirection="row" key={result.value}>
								<Box marginRight={1}>
									<Text bold>{result.title}</Text>
								</Box>
								<Text color="green">{result.value}</Text>
							</Box>
						) : null;
					})}
				</Box>
			)}
			{component}
		</Box>
	);
};

Wizard.propTypes = {
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

export default Wizard;
