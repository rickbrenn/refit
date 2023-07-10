import React, {
	createContext,
	useContext,
	useMemo,
	useState,
	Children,
} from 'react';
import PropTypes from 'prop-types';

const WizardContext = createContext();
const useWizard = () => useContext(WizardContext);

const Wizard = ({ controlledStep, children }) => {
	const [step, setStep] = useState(0);

	const values = useMemo(() => {
		return {
			goToNextStep: () => setStep((prevState) => prevState + 1),
			goToPreviousStep: () => setStep((prevState) => prevState - 1),
			goToStep: (newStep) => {
				if (typeof newStep !== 'number') {
					throw new Error('Step number must be a number');
				}

				setStep(newStep);
			},
		};
	}, []);

	const activeStep = useMemo(
		() => Children.toArray(children)[controlledStep ?? step],
		[children, step, controlledStep]
	);

	return (
		<WizardContext.Provider value={values}>
			{activeStep}
		</WizardContext.Provider>
	);
};

Wizard.propTypes = {
	controlledStep: PropTypes.number,
	children: PropTypes.node.isRequired,
};

Wizard.defaultProps = {
	controlledStep: null,
};

export { Wizard, useWizard };
