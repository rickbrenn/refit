import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import { CheckSelector } from '../../ui/Selector';
import Header from './Header';
import { useWizard } from '../../ui/Wizard';

const PackagesStep = ({
	dependencies,
	wizardState,
	packages,
	setWizardState,
}) => {
	const { goToNextStep } = useWizard();
	const [hasValidationError, setHasValidationError] = useState(false);

	const packageOptions = useMemo(() => {
		const dep = dependencies.find((d) => d.name === wizardState.dependency);
		const { apps = {}, versionData = {} } = dep || {};

		const packageList = Object.keys(packages).sort();
		const options = packageList
			.map((name) => {
				const { target } = apps[name] || {};
				return {
					name,
					hasPackage: !!target,
					versionData: versionData[target] || {},
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
	}, [wizardState?.dependency, dependencies, packages]);

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
						setWizardState((prevState) => ({
							...prevState,
							updates: [
								...prevState.updates,
								{
									dependency: prevState.dependency,
									version: prevState.version,
									packages: value.map((v) => v.name),
								},
							],
						}));
						goToNextStep();
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
								<Text color="gray">(</Text>
								<Text color="blue">{'<space>'}</Text>
								<Text color="gray">{' to select, '}</Text>
								<Text color="blue">{'<a>'}</Text>
								<Text color="gray">{' to select all)'}</Text>
							</Box>
						</Box>
					);
				}}
				defaultSelected={packageOptions.defaultSelected}
				labelKey="name"
				renderItem={(item, highlighted, selected, textColor) => {
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
		dependency: PropTypes.string,
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
	packages: PropTypes.shape({}).isRequired,
};

export default PackagesStep;
