import React from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import { Selector } from '../../ui/Selector';
import steps from './wizardSteps';

const SummaryStep = ({ wizardState, setWizardState, updateDependencies }) => {
	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text>Summary:</Text>
			</Box>
			<Box marginLeft={1} marginBottom={1} flexDirection="column">
				{wizardState.updates.map((update) => {
					return (
						<Box key={update.dependency}>
							<Box marginRight={1} flexShrink={0}>
								<Text>{`${update.dependency}@${update.version}`}</Text>
							</Box>
							<Text>{`(${update.packages
								.map(({ name, type }) => `${name}:${type}`)
								.join(', ')})`}</Text>
						</Box>
					);
				})}
			</Box>
			<Selector
				items={['Add another', 'Edit updates', 'Done']}
				onSelect={(value) => {
					if (value === 'Done') {
						updateDependencies();
						setWizardState((prevState) => ({
							...prevState,
							version: null,
							dependency: null,
							packages: null,
							step: steps.done,
						}));
					}

					if (value === 'Edit updates') {
						setWizardState((prevState) => ({
							...prevState,
							version: null,
							dependency: null,
							packages: null,
							step: steps.edit,
						}));
					}

					if (value === 'Add another') {
						setWizardState((prevState) => ({
							...prevState,
							version: null,
							dependency: null,
							packages: null,
							step: steps.dependency,
						}));
					}
				}}
			/>
		</Box>
	);
};

SummaryStep.propTypes = {
	wizardState: PropTypes.shape({
		updates: PropTypes.arrayOf(PropTypes.shape({})),
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
	updateDependencies: PropTypes.func.isRequired,
};

export default SummaryStep;
