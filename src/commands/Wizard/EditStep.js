import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box } from 'ink';
import { Selector } from '../../ui/Selector';
import steps from './wizardSteps';

const EditStep = ({ wizardState, setWizardState }) => {
	const handleRemoveUpdate = (value) => {
		const updates = wizardState.updates.filter(
			(_, index) => index !== value.index
		);

		setWizardState((prevState) => {
			return {
				...prevState,
				updates,
				step: updates.length ? steps.summary : 0,
			};
		});
	};

	return (
		<Selector
			items={wizardState.updates.map((u, i) => ({
				...u,
				name: u.dependency,
				index: i,
			}))}
			onSelect={handleRemoveUpdate}
			limit={8}
			labelKey="name"
			renderTitle={() => {
				return (
					<Box>
						<Box marginRight="1">
							<Text>Select updates to remove</Text>
						</Box>
						<Box>
							<Text color="gray">(</Text>
							<Text color="blue">{'<enter>'}</Text>
							<Text color="gray">{' to remove update, '}</Text>
							<Text color="blue">{'<q>'}</Text>
							<Text color="gray">{' to return)'}</Text>
						</Box>
					</Box>
				);
			}}
			inputHandler={({ input }) => {
				if (input === 'q') {
					setWizardState((prevState) => {
						return {
							...prevState,
							step: steps.summary,
						};
					});
				}
			}}
			renderHighlighter={(item, highlighted) => {
				return <Text color="red">{highlighted ? 'X' : ' '}</Text>;
			}}
			renderItem={(item) => {
				const value = `${item.dependency}@${item.version}`;
				return (
					<Box key={value}>
						<Box marginRight={1} flexShrink={0}>
							<Text>{value}</Text>
						</Box>
						<Text>{`(${item.packages
							.map(({ name, type }) => `${name}:${type}`)
							.join(', ')})`}</Text>
					</Box>
				);
			}}
		/>
	);
};

EditStep.propTypes = {
	wizardState: PropTypes.shape({
		updates: PropTypes.arrayOf(PropTypes.shape({})),
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
};

export default EditStep;
