import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Text, Box, useFocusManager } from 'ink';
import semver from 'semver';
import { Selector } from '../../ui/Selector';
import Changelog from '../../ui/Changelog/Changelog';
import { useError } from '../../ui/ErrorBoundary';
import FocusTarget from '../../ui/FocusTarget';
import { createDependency, getRegistryData } from '../../common/dependencies';
import Header from './Header';

const DependencyStep = ({
	dependencies,
	wizardState,
	setWizardState,
	updateLoading,
	updateLoaderText,
	allowPrerelease,
	allowDeprecated,
	formatDependency,
}) => {
	const { setError } = useError();
	const [changelog, setChangelog] = useState({
		open: false,
		name: null,
		version: null,
	});
	const { focus } = useFocusManager();

	const selectorItems = useMemo(() => {
		// Filter out dependencies that have already been updated
		return dependencies.filter((dep) => {
			return !wizardState.updates.some(
				(update) => update.dependency === dep.name
			);
		});
	}, [dependencies, wizardState.updates]);

	const goToNextStep = (dep, newDep = false) => {
		setWizardState((prevState) => ({
			...prevState,
			dependency: dep,
			new: newDep,
			step: prevState.step + 1,
			errorMessage: null,
		}));
	};

	const handleSelect = async (value) => {
		if (value.create) {
			try {
				updateLoading(true);
				updateLoaderText(`Fetching data for ${value.name}`);

				const registryData = await getRegistryData(value.name);

				const dep = createDependency({
					dependency: {
						name: value.name,
					},
					registryData,
					config: {
						allowPrerelease,
						allowDeprecated,
					},
				});

				if (dep.notOnRegistry) {
					setWizardState((prevState) => ({
						...prevState,
						dependency: null,
						errorMessage: 'Dependency not found!',
					}));
				} else {
					const formattedDep = formatDependency(dep);
					goToNextStep(formattedDep, true);
				}

				updateLoading(false);
				updateLoaderText('');
			} catch (error) {
				setError(error);
			}
		} else {
			goToNextStep(value);
		}
	};

	return (
		<>
			<FocusTarget active={!changelog.open} id="selector" autoFocus>
				{(isFocused) => {
					return (
						<>
							<Header wizardState={wizardState} />
							<Selector
								items={selectorItems}
								onSelect={handleSelect}
								isFocused={isFocused}
								limit={8}
								labelKey="name"
								renderTitle={() => {
									return (
										<Box>
											<Box marginRight="1">
												<Text>
													Select a package below to
													add or update
												</Text>
											</Box>
											<Box>
												<Text color="grey">(</Text>
												<Text color="magenta">
													{'<tab>'}
												</Text>
												<Text color="grey">
													{' to view changelog)'}
												</Text>
											</Box>
										</Box>
									);
								}}
								searchable
								creatable
								searchByKey="name"
								renderItem={({ item, textColor }) => {
									const installedVersions = Object.values(
										item.versionData
									);

									const coloredVersionsComponent =
										installedVersions.reduce(
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
													item.name +
													uncoloredText +
													coloredText;
												const versionComp = (
													<Text key={versionKey}>
														{wildcard +
															uncoloredText +
															midDot}
														<Text color={color}>
															{coloredText}
														</Text>
													</Text>
												);

												const delimiterKey = `${versionKey}delimiter`;
												const delimiter = (
													<Text key={delimiterKey}>
														,{' '}
													</Text>
												);

												if (acc === null) {
													return [versionComp];
												}

												return [
													...acc,
													delimiter,
													versionComp,
												];
											},
											null
										);

									return (
										<Box>
											<Box marginRight={1} flexShrink={0}>
												<Text color={textColor}>
													{item.name}
												</Text>
											</Box>
											{item.upgradable && (
												<Box>
													<Box marginRight={1}>
														<Text>(</Text>
														{
															coloredVersionsComponent
														}
													</Box>
													<Box marginRight={1}>
														<Text>{`->`}</Text>
													</Box>
													<Box>
														<Text>
															{
																item
																	.versionRange
																	.latest
															}
														</Text>
														<Text>)</Text>
													</Box>
												</Box>
											)}
										</Box>
									);
								}}
								inputHandler={({ key }, { item }) => {
									if (key.tab) {
										const installedVersions = Object.values(
											item.appVersions
										)
											.filter(Boolean)
											.map((v) => v.installed)
											.sort((a, b) =>
												semver.compare(b, a)
											);

										setChangelog({
											open: true,
											name: item.name,
											version:
												installedVersions[
													installedVersions.length - 1
												],
										});
										focus('changelog');
									}
								}}
							/>
						</>
					);
				}}
			</FocusTarget>
			<FocusTarget
				active={changelog.open}
				id="changelog"
				keepRendered={false}
			>
				{(isFocused) => {
					return (
						<Changelog
							open={changelog.open}
							name={changelog.name}
							version={changelog.version}
							onExit={() => {
								setChangelog({
									open: false,
									name: null,
									version: null,
								});
								focus('selector');
							}}
							exitKey={(input, key) => key.tab}
							exitKeyLabel="tab"
							exitText="back"
							isFocused={isFocused}
							showExitOnFallback
						/>
					);
				}}
			</FocusTarget>
		</>
	);
};

DependencyStep.propTypes = {
	dependencies: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	wizardState: PropTypes.shape({
		updates: PropTypes.arrayOf(PropTypes.shape({})),
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
	updateLoading: PropTypes.func.isRequired,
	updateLoaderText: PropTypes.func.isRequired,
	allowPrerelease: PropTypes.bool.isRequired,
	allowDeprecated: PropTypes.bool.isRequired,
	formatDependency: PropTypes.func.isRequired,
};

export default DependencyStep;
