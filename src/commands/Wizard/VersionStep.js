import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import { Selector } from '../../ui/Selector';
import Header from './Header';
import steps from './wizardSteps';
import { validWildcards } from '../../common/dependencies';

const VersionStep = ({ wizardState, setWizardState, packages, isMonorepo }) => {
	const getDefaultWildcard = () => {
		const { appVersions = {} } = wizardState.dependency || {};
		const wildcards = Object.values(appVersions).map((a) => a.wildcard);
		const uniqueWildcards = [...new Set(wildcards)];

		if (uniqueWildcards.length) {
			return uniqueWildcards[0];
		}

		return wizardState.wildcard;
	};

	const [selectedWildcard, setSelectedWildcard] =
		useState(getDefaultWildcard);

	const versionOptions = useMemo(() => {
		const {
			versions = [],
			distTags = {},
			appVersions = {},
		} = wizardState.dependency || {};

		const sortedVersions = [...versions].reverse();

		const distTagOptions = [];

		for (const [distTag, version] of Object.entries(distTags)) {
			distTagOptions.push({
				version,
				distTag,
				apps: Object.keys(appVersions).filter(
					(app) => appVersions[app].wanted === version
				),
				key: version + distTag,
			});
		}

		const wantedVersions = [];
		const restOfOptions = [];

		const versionsToExclude = Object.values(distTags);
		for (const version of sortedVersions) {
			if (!versionsToExclude.includes(version)) {
				const optionTypeArray = Object.keys(appVersions).some(
					(app) => appVersions[app].wanted === version
				)
					? wantedVersions
					: restOfOptions;

				optionTypeArray.push({
					version,
					distTag: null,
					apps: Object.keys(appVersions).filter(
						(app) => appVersions[app].wanted === version
					),
					key: version,
				});
			}
		}

		return [...distTagOptions, ...wantedVersions, ...restOfOptions];
	}, [wizardState.dependency]);

	return (
		<>
			<Header wizardState={wizardState} />
			<Selector
				items={versionOptions}
				onSelect={(value) => {
					let nextStep = steps.summary;
					if (isMonorepo) {
						nextStep = steps.packages;
					} else if (wizardState.new) {
						nextStep = steps.depTypes;
					}

					const defaultPackage = Object.keys(packages)[0];
					const defaultDepType =
						wizardState.dependency?.appVersions?.[defaultPackage]
							?.type;

					setWizardState((prevState) => ({
						...prevState,
						version: value.version,
						step: nextStep,
						wildcard: selectedWildcard,
						...(nextStep === steps.depTypes && {
							packages: [
								{
									name: defaultPackage,
									type: defaultDepType,
								},
							],
						}),
						...(nextStep === steps.summary && {
							updates: [
								...prevState.updates,
								{
									dependency: prevState.dependency,
									version: value.version,
									wildcard: selectedWildcard,
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
				renderTitle={() => {
					return (
						<Box>
							<Box marginRight="1">
								<Text>Select a version below to install</Text>
							</Box>
							<Box>
								<Text color="grey">(</Text>
								<Text>
									<Text color="magenta">◄</Text>{' '}
									<Text color="magenta">►</Text>
								</Text>
								<Text color="grey">
									{' to change wildcard)'}
								</Text>
							</Box>
						</Box>
					);
				}}
				searchable
				searchByKey="version"
				itemKey="key"
				renderItem={({ item, textColor }) => {
					return (
						<Box>
							<Box marginRight={1} flexShrink={0}>
								<Text color={textColor}>
									{selectedWildcard + item.version}
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
				inputHandler={({ key }) => {
					if (key.leftArrow || key.rightArrow) {
						const currentWildcardIndex = validWildcards.findIndex(
							(w) => w === selectedWildcard
						);

						if (key.leftArrow) {
							const nextIndex =
								currentWildcardIndex === 0
									? validWildcards.length - 1
									: currentWildcardIndex - 1;

							setSelectedWildcard(validWildcards[nextIndex]);
						}

						if (key.rightArrow) {
							const nextIndex =
								currentWildcardIndex ===
								validWildcards.length - 1
									? 0
									: currentWildcardIndex + 1;

							setSelectedWildcard(validWildcards[nextIndex]);
						}
					}
				}}
			/>
		</>
	);
};

VersionStep.propTypes = {
	wizardState: PropTypes.shape({
		dependency: PropTypes.shape({
			appVersions: PropTypes.shape({}),
		}),
		new: PropTypes.bool,
		wildcard: PropTypes.string,
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
	packages: PropTypes.shape({}).isRequired,
	isMonorepo: PropTypes.bool.isRequired,
};

export default VersionStep;
