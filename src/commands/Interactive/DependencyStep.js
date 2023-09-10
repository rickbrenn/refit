import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box } from 'ink';
import { Selector } from '../../ui/Selector';
import Header from './Header';

const DependencyStep = ({ dependencies, wizardState, setWizardState }) => {
	return (
		<>
			<Header wizardState={wizardState} />
			<Selector
				items={dependencies.filter(
					(dep) =>
						!wizardState.updates.some(
							(update) => update.dependency === dep.name
						)
				)}
				onSelect={(value) => {
					setWizardState((prevState) => ({
						...prevState,
						dependency: {
							name: value.name,
							new: !!value.create,
						},
						step: prevState.step + 1,
					}));
				}}
				limit={8}
				labelKey="name"
				title="Select a package below to add or update"
				searchable
				creatable
				searchByKey="name"
				renderItem={(item, highlighted, selected, textColor) => {
					const installedVersions = Object.values(item.versionData);

					const coloredVersionsComponent = installedVersions.reduce(
						(acc, curr) => {
							const {
								color,
								wildcard,
								midDot,
								uncoloredText,
								coloredText,
								updateType,
							} = curr;

							if (!updateType) {
								return acc;
							}

							const versionKey =
								item.name + uncoloredText + coloredText;
							const versionComp = (
								<Text key={versionKey}>
									{wildcard + uncoloredText + midDot}
									<Text color={color}>{coloredText}</Text>
								</Text>
							);

							const delimiterKey = `${versionKey}delimiter`;
							const delimiter = (
								<Text key={delimiterKey}>, </Text>
							);

							if (acc === null) {
								return [versionComp];
							}

							return [...acc, delimiter, versionComp];
						},
						null
					);

					return (
						<Box>
							<Box marginRight={1} flexShrink={0}>
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
				}}
			/>
		</>
	);
};

DependencyStep.propTypes = {
	dependencies: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	wizardState: PropTypes.shape({
		updates: PropTypes.arrayOf(PropTypes.shape({})),
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
};

export default DependencyStep;
