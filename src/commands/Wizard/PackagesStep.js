import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import { CheckSelector } from '../../ui/Selector';
import Header from './Header';
import steps from './wizardSteps';

const PackagesStep = ({ wizardState, packages, setWizardState }) => {
	const packageOptions = useMemo(() => {
		const { appVersions = {}, versionData = {} } =
			wizardState.dependency || {};

		const packageList = Object.keys(packages).sort();
		const options = packageList
			.map((name) => {
				const { target, type } = appVersions[name] || {};
				return {
					name,
					hasPackage: !!target,
					versionData: versionData[target] || {},
					type,
				};
			})
			// sort packages by ones with the dep, then alphabetically
			.sort((a, b) => {
				if (a.hasPackage && !b.hasPackage) {
					return -1;
				}

				if (!a.hasPackage && b.hasPackage) {
					return 1;
				}

				return a.name.localeCompare(b.name);
			});

		const installedApps = Object.keys(appVersions);
		const defaultSelected = installedApps.map((app) =>
			options.findIndex((opt) => opt.name === app)
		);

		return {
			options,
			defaultSelected,
		};
	}, [wizardState.dependency, packages]);

	return (
		<>
			<Header wizardState={wizardState} />
			<CheckSelector
				items={packageOptions.options}
				onSelect={(value) => {
					if (!value || value?.length === 0) {
						setWizardState((prevState) => ({
							...prevState,
							errorMessage: 'Please select at least one package',
						}));
					} else {
						const newDep = value.some((v) => !v.hasPackage);
						const nextStep = newDep
							? steps.depTypes
							: steps.summary;
						const packagesData = value.map((v) => ({
							name: v.name,
							type: v.type,
						}));
						setWizardState((prevState) => ({
							...prevState,
							step: nextStep,
							packages: packagesData,
							errorMessage: null,
							...(nextStep === steps.summary && {
								updates: [
									// Remove any existing updates for this dependency
									...prevState.updates.filter(
										(u) =>
											u.dependency.name !==
											prevState.dependency.name
									),
									{
										dependency: prevState.dependency,
										version: prevState.version,
										packages: packagesData,
										wildcard: prevState.wildcard,
									},
								],
							}),
						}));
					}
				}}
				limit={8}
				renderTitle={() => {
					return (
						<Box>
							<Box marginRight="1">
								<Text>Select a package below</Text>
							</Box>
							<Box>
								<Text color="grey">(</Text>
								<Text color="magenta">{'<space>'}</Text>
								<Text color="grey">{' to select, '}</Text>
								<Text color="magenta">{'<a>'}</Text>
								<Text color="grey">{' to select all)'}</Text>
							</Box>
						</Box>
					);
				}}
				defaultSelected={packageOptions.defaultSelected}
				labelKey="name"
				renderItem={({ item, textColor }) => {
					const {
						color,
						wildcard,
						midDot,
						uncoloredText,
						coloredText,
					} = item.versionData || {};

					return (
						<Box>
							<Box marginRight={1} flexShrink={0}>
								<Text color={textColor}>{item.name}</Text>
							</Box>
							{item.hasPackage && (
								<Box marginRight={1}>
									<Text>
										({wildcard + uncoloredText + midDot}
										<Text color={color}>{coloredText}</Text>
										)
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

PackagesStep.propTypes = {
	wizardState: PropTypes.shape({
		dependency: PropTypes.shape({
			name: PropTypes.string,
		}),
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
	packages: PropTypes.shape({}).isRequired,
};

export default PackagesStep;
