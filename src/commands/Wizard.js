import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';

import Loader from '../ui/Loader';
import { Selector, CheckSelector } from '../ui/Selector';

import { getRootPath } from '../common/filesystem';
import { getPackages } from '../common/packages';
import { getDependencyList, getDiffVersionParts } from '../common/dependencies';

/* 
	- figure out steps config / only showing packages step for monorepos
	- figure out packages options structure and what data is needed
	- add summary step
	- add final update step

	- consolidate loader state
	- abstract out loader functionality
	- address TODOs 
	- handle no packages
	- trim search text (bug in ink-text-input with this)
	- add selected options from previous steps to top of UI
*/

const Wizard = ({ config }) => {
	const [loading, setLoading] = useState(true);
	const [loaderText, setLoaderText] = useState('Loading the truck..');

	const [step, setStep] = useState(0);

	const [packages, setPackages] = useState([]);
	const [dependencies, setDependencies] = useState([]);

	const [selections, setSelections] = useState({
		dependency: null,
		version: null,
		packages: null,
	});

	// const [dependency, setDependency] = useState(null);
	// const [version, setVersion] = useState(null);

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

	const handleDependencySelect = (value) => {
		// console.log('selected: ', value);

		setSelections((prevState) => ({
			...prevState,
			dependency: value,
		}));

		setStep(1);
	};

	const handleVersionSelect = (value) => {
		console.log('selected: ', value);

		setSelections((prevState) => ({
			...prevState,
			version: value,
		}));

		setStep(2);
	};

	const handlePackageSelect = (value) => {
		console.log('selected: ', value);

		setSelections((prevState) => ({
			...prevState,
			packages: value.name,
		}));

		setStep(3);
	};

	useEffect(() => {
		fetchPackagesAndDependencies();
	}, [fetchPackagesAndDependencies]);

	const versionOptions = useMemo(() => {
		const {
			versions = [],
			distTags = {},
			apps = {},
		} = selections.dependency || {};

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
	}, [selections.dependency]);

	const renderDependencyItem = (item, selected, textColor) => {
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
			value: selections.dependency?.name,
			show: true,
			component: (
				<Selector
					items={dependencies}
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
			value: selections.version?.version,
			show: true,
			component: (
				<Selector
					items={versionOptions}
					onSelect={handleVersionSelect}
					limit={8}
					labelKey="version"
					title="Select a version below to install"
					searchable
					searchByKey="version"
					renderItem={(item, selected, textColor) => {
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
			title: 'Selected Package:',
			value: selections.packages,
			show: config.isMonorepo,
			component: (
				// <Selector
				// 	items={Object.keys(packages).map((pkg) => ({ name: pkg }))}
				// 	onSelect={handlePackageSelect}
				// 	limit={8}
				// 	labelKey="name"
				// 	title="Select a package below"
				// />
				<CheckSelector
					items={Object.keys(packages).map((pkg) => ({ name: pkg }))}
					onSelect={handlePackageSelect}
					limit={8}
					labelKey="name"
					title="Select a package below"
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

	return (
		<Box flexDirection="column" marginTop={1} marginBottom={1}>
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
			{steps[step].component}
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
