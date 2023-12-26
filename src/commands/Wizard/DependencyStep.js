import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box, useFocusManager } from 'ink';
import semver from 'semver';
import { Selector } from '../../ui/Selector';
import Changelog from '../../ui/Changelog/Changelog';
import Header from './Header';
import FocusTarget from '../../ui/FocusTarget';

const DependencyStep = ({ dependencies, wizardState, setWizardState }) => {
	const [changelog, setChangelog] = useState({
		open: false,
		name: null,
		version: null,
	});
	const { focus } = useFocusManager();

	const selectorItems = useMemo(
		() =>
			dependencies.filter(
				(dep) =>
					!wizardState.updates.some(
						(update) => update.dependency === dep.name
					)
			),
		[dependencies, wizardState.updates]
	);

	return (
		<>
			<FocusTarget active={!changelog.open} id="selector" autoFocus>
				{(isFocused) => {
					return (
						<>
							<Header wizardState={wizardState} />
							<Selector
								items={selectorItems}
								onSelect={(value) => {
									setWizardState((prevState) => ({
										...prevState,
										dependency: {
											name: value.name,
											new: !!value.create,
										},
										step: prevState.step + 1,
										errorMessage: null,
									}));
								}}
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
												<Text color="gray">(</Text>
												<Text color="magenta">
													{'<tab>'}
												</Text>
												<Text color="gray">
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
															{item.latestRange}
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
											item.apps
										)
											.filter(Boolean)
											.map((v) => v.installed)
											.toSorted((a, b) =>
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
};

export default DependencyStep;
