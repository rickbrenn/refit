import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box } from 'ink';
import { Selector } from '../../ui/Selector';
import LoaderBoundary from '../../ui/LoaderBoundary';
import { getDependencyInfo } from '../../common/dependencies';
import Header from './Header';

const VersionStep = ({
	dependencies,
	wizardState,
	setWizardState,
	packages,
	isMonorepo,
	allowPrerelease,
	allowDeprecated,
}) => {
	const existingDependency = dependencies.find(
		(d) => d.name === wizardState.dependency.name
	);
	const [depData, setDepData] = useState({
		loading: !!wizardState.dependency.new,
		dep: existingDependency,
	});

	const getNewDependency = useCallback(
		async (name) => {
			setDepData((prevState) => ({
				...prevState,
				loading: true,
			}));

			// TODO: error handling
			const dep = await getDependencyInfo({
				dependency: {
					name,
				},
				config: {
					allowPrerelease,
					allowDeprecated,
				},
			});

			setDepData({
				loading: false,
				dep,
			});
		},
		[allowPrerelease, allowDeprecated]
	);

	useEffect(() => {
		if (wizardState.dependency.new) {
			getNewDependency(wizardState.dependency.name);
		}
	}, [getNewDependency, wizardState.dependency]);

	const versionOptions = useMemo(() => {
		const { versions = [], distTags = {}, apps = {} } = depData.dep || {};

		const sortedVersions = [...versions].reverse();

		const distTagOptions = [];

		for (const [distTag, version] of Object.entries(distTags)) {
			distTagOptions.push({
				version,
				distTag,
				apps: Object.keys(apps).filter(
					(app) => apps[app].wanted === version
				),
				key: version + distTag,
			});
		}

		const wantedVersions = [];
		const restOfOptions = [];

		const versionsToExclude = Object.values(distTags);
		for (const version of sortedVersions) {
			if (!versionsToExclude.includes(version)) {
				const optionTypeArray = Object.keys(apps).some(
					(app) => apps[app].wanted === version
				)
					? wantedVersions
					: restOfOptions;

				optionTypeArray.push({
					version,
					distTag: null,
					apps: Object.keys(apps).filter(
						(app) => apps[app].wanted === version
					),
					key: version,
				});
			}
		}

		return [...distTagOptions, ...wantedVersions, ...restOfOptions];
	}, [depData.dep]);

	return (
		<>
			<Header wizardState={wizardState} />
			<LoaderBoundary
				loading={depData.loading}
				text="Fetching dependency from registry"
				debounceMs={500}
			>
				<Selector
					items={versionOptions}
					onSelect={(value) => {
						let nextStep = 4;
						if (isMonorepo) {
							nextStep = 2;
						} else if (wizardState.dependency.new) {
							nextStep = 3;
						}

						const defaultPackage = Object.keys(packages)[0];
						const defaultDepType =
							existingDependency?.apps?.[defaultPackage]?.type;

						setWizardState((prevState) => ({
							...prevState,
							version: value.version,
							step: nextStep,
							...(nextStep === 3 && {
								packages: [
									{
										name: defaultPackage,
										type: defaultDepType,
									},
								],
							}),
							...(nextStep === 4 && {
								updates: [
									...prevState.updates,
									{
										dependency: prevState.dependency.name,
										version: value.version,
										packages: [
											{
												name: defaultPackage,
												type: defaultDepType,
											},
										],
									},
								],
							}),
						}));
					}}
					limit={8}
					labelKey="version"
					title="Select a version below to install"
					searchable
					searchByKey="version"
					itemKey="key"
					renderItem={(item, highlighted, selected, textColor) => {
						return (
							<Box>
								<Box marginRight={1} flexShrink={0}>
									<Text color={textColor}>
										{item.version}
									</Text>
								</Box>

								{item.distTag && (
									<Box marginRight={1} flexShrink={0}>
										<Text color="green">{`#${item.distTag}`}</Text>
									</Box>
								)}
								{item.apps.length > 0 && (
									<Box>
										<Text color="green">
											{isMonorepo
												? `(${item.apps.join(', ')})`
												: '(installed)'}
										</Text>
									</Box>
								)}
							</Box>
						);
					}}
				/>
			</LoaderBoundary>
		</>
	);
};

VersionStep.propTypes = {
	dependencies: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	wizardState: PropTypes.shape({
		dependency: PropTypes.shape({
			name: PropTypes.string,
			new: PropTypes.bool,
		}),
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
	packages: PropTypes.shape({}).isRequired,
	isMonorepo: PropTypes.bool.isRequired,
	allowPrerelease: PropTypes.bool.isRequired,
	allowDeprecated: PropTypes.bool.isRequired,
};

export default VersionStep;
