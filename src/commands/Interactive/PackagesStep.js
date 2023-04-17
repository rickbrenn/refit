import React, { useMemo } from 'react';
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

	const packageOptions = useMemo(() => {
		const dep = dependencies.find((d) => d.name === wizardState.dependency);
		const { apps = {}, versionData = {} } = dep || {};
		const installedApps = Object.keys(apps);
		const options = Object.keys(packages);
		const defaultSelected = installedApps.map((app) =>
			options.indexOf(app)
		);

		return {
			options: options.map((option) => {
				const appVersions = apps[option] || {};
				return {
					name: option,
					...appVersions,
					versionData: versionData[appVersions.target] || {},
				};
			}),
			defaultSelected,
		};
	}, [wizardState?.dependency, dependencies, packages]);

	return (
		<>
			<Header wizardState={wizardState} />
			<CheckSelector
				key="packages"
				items={packageOptions.options}
				onSelect={(value) => {
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
				}}
				limit={8}
				title="Select a package below"
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
							{item.target && (
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
