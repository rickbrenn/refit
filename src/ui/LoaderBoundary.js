import React from 'react';
import PropTypes from 'prop-types';
import Loader from './Loader';

const LoaderBoundary = ({ loading, text, children }) => {
	return loading ? <Loader text={text} /> : children;
};

LoaderBoundary.propTypes = {
	loading: PropTypes.bool.isRequired,
	children: PropTypes.node.isRequired,
	text: PropTypes.string,
};

LoaderBoundary.defaultProps = {
	text: '',
};

export default LoaderBoundary;
