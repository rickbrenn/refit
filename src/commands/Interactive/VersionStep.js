import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box } from 'ink';
import { Selector } from '../../ui/Selector';
import Header from './Header';

const VersionStep = ({
	dependencies,
	wizardState,
	setWizardState,
	packages,
	isMonorepo,
}) => {
	const versionOptions = useMemo(() => {
		const dep = dependencies.find((d) => d.name === wizardState.dependency);
		const { versions = [], distTags = {}, apps = {} } = dep || {};

		const sortedVersions = [...versions].reverse();

		const distTagOptions = [];

		for (const [distTag, version] of Object.entries(distTags)) {
			distTagOptions.push({
				version,
				distTag,
				apps: Object.keys(apps).filter(
					(app) => apps[app].installed === version
				),
				key: version + distTag,
			});
		}

		const installedVersions = [];
		const restOfOptions = [];

		const versionsToExclude = Object.values(distTags);
		for (const version of sortedVersions) {
			if (!versionsToExclude.includes(version)) {
				const optionTypeArray = Object.keys(apps).some(
					(app) => apps[app].installed === version
				)
					? installedVersions
					: restOfOptions;

				optionTypeArray.push({
					version,
					distTag: null,
					apps: Object.keys(apps).filter(
						(app) => apps[app].installed === version
					),
					key: version,
				});
			}
		}

		return [...distTagOptions, ...installedVersions, ...restOfOptions];
	}, [wizardState?.dependency, dependencies]);

	return (
		<>
			<Header wizardState={wizardState} />
			<Selector
				items={versionOptions}
				onSelect={(value) => {
					setWizardState((prevState) => ({
						...prevState,
						version: value.version,
						step: isMonorepo ? 2 : 3,
						...(!isMonorepo && {
							updates: [
								...prevState.updates,
								{
									dependency: prevState.dependency,
									version: value.version,
									packages: [Object.keys(packages)[0]],
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
								<Text color={textColor}>{item.version}</Text>
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
		</>
	);
};

VersionStep.propTypes = {
	dependencies: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	wizardState: PropTypes.shape({
		dependency: PropTypes.string,
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
	packages: PropTypes.shape({}).isRequired,
	isMonorepo: PropTypes.bool.isRequired,
};

export default VersionStep;
