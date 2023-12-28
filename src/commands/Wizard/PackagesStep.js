import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box } from 'ink';
import { CheckSelector } from '../../ui/Selector';
import Header from './Header';
import steps from './wizardSteps';

const PackagesStep = ({
	dependencies,
	wizardState,
	packages,
	setWizardState,
}) => {
	const [hasValidationError, setHasValidationError] = useState(false);

	const packageOptions = useMemo(() => {
		const dep = dependencies.find(
			(d) => d.name === wizardState.dependency.name
		);
		const { apps = {}, versionData = {} } = dep || {};

		const packageList = Object.keys(packages).sort();
		const options = packageList
			.map((name) => {
				const { target, type } = apps[name] || {};
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

		const installedApps = Object.keys(apps);
		const defaultSelected = installedApps.map((app) =>
			options.findIndex((opt) => opt.name === app)
		);

		return {
			options,
			defaultSelected,
		};
	}, [wizardState.dependency.name, dependencies, packages]);

	return (
		<>
			<Header wizardState={wizardState} />
			{hasValidationError && (
				<Text color="red">Please select at least one package</Text>
			)}
			<CheckSelector
				items={packageOptions.options}
				onSelect={(value) => {
					if (!value || value?.length === 0) {
						setHasValidationError(true);
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
							...(nextStep === steps.summary && {
								updates: [
									...prevState.updates,
									{
										dependency: prevState.dependency.name,
										version: prevState.version,
										packages: packagesData,
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
	dependencies: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	wizardState: PropTypes.shape({
		dependency: PropTypes.shape({
			name: PropTypes.string,
			new: PropTypes.bool,
		}),
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
	packages: PropTypes.shape({}).isRequired,
};

export default PackagesStep;
