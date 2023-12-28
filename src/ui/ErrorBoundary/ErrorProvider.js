import React, { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

const ErrorContext = createContext();
const useError = () => useContext(ErrorContext);

const ErrorProvider = ({ children, setError }) => {
	const values = useMemo(() => ({ setError }), [setError]);

	return (
		<ErrorContext.Provider value={values}>{children}</ErrorContext.Provider>
	);
};

ErrorProvider.propTypes = {
	children: PropTypes.node.isRequired,
	setError: PropTypes.func.isRequired,
};

export { useError, ErrorProvider };
