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

const Wizard = ({ children }) => {
	const [step, setStep] = useState(0);

	// TODO: add step number validation
	const values = useMemo(() => {
		return {
			goToNextStep: () => setStep((prevState) => prevState + 1),
			goToPreviousStep: () => setStep((prevState) => prevState - 1),
			goToStep: setStep,
		};
	}, []);

	const activeStep = useMemo(
		() => Children.toArray(children)[step],
		[children, step]
	);

	return (
		<WizardContext.Provider value={values}>
			{activeStep}
		</WizardContext.Provider>
	);
};

Wizard.propTypes = {
	children: PropTypes.node.isRequired,
};

Wizard.defaultProps = {};

export { Wizard, useWizard };
