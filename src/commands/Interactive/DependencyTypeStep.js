import React from 'react';
import PropTypes from 'prop-types';
import { Selector } from '../../ui/Selector';
import { depTypesList } from '../../common/dependencies';
import Header from './Header';

const DependencyTypeStep = ({ wizardState, setWizardState }) => {
	return (
		<>
			<Header wizardState={wizardState} />
			<Selector
				title="Select a dependency type"
				items={Object.entries(depTypesList).map(([key, value]) => ({
					label: value,
					typeKey: key,
				}))}
				onSelect={(value) => {
					setWizardState((prevState) => ({
						...prevState,
						step: prevState.step + 1,
						updates: [
							...prevState.updates,
							{
								dependency: prevState.dependency.name,
								version: prevState.version,
								packages: prevState.packages,
								dependencyType: value.typeKey,
							},
						],
					}));
				}}
			/>
		</>
	);
};

DependencyTypeStep.propTypes = {
	wizardState: PropTypes.shape({
		dependency: PropTypes.shape({ name: PropTypes.string }),
	}).isRequired,
	setWizardState: PropTypes.func.isRequired,
};

export default DependencyTypeStep;
