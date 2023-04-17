import React from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import { Selector } from '../../ui/Selector';
import { useWizard } from '../../ui/Wizard';

const SummaryStep = ({
	wizardState,
	setWizardState,
	updateDependencies,
	isMonorepo,
}) => {
	const { goToStep } = useWizard();

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
							{isMonorepo && (
								<Text>{`(${update.packages.join(', ')})`}</Text>
							)}
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
						}));
						goToStep(5);
					}

					if (value === 'Edit updates') {
						setWizardState((prevState) => ({
							...prevState,
							version: null,
							dependency: null,
						}));
						goToStep(4);
					}

					if (value === 'Add another') {
						setWizardState((prevState) => ({
							...prevState,
							version: null,
							dependency: null,
						}));
						goToStep(0);
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
	isMonorepo: PropTypes.bool.isRequired,
};

export default SummaryStep;
