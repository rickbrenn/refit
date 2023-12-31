import React from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from 'ink';
import { ErrorProvider } from './ErrorProvider';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};

		this.setError = this.setError.bind(this);
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	setError(error) {
		this.setState({ hasError: true, error });
	}

	render() {
		const { hasError, error } = this.state;

		if (hasError) {
			return (
				<Box flexDirection="column" margin={1} gap={1}>
					<Box gap={1}>
						<Text color="white" backgroundColor="red">
							{' ERROR '}
						</Text>
						<Text>{error?.message}</Text>
					</Box>
					<Text color="grey" dimColor>
						{error?.stack}
					</Text>
				</Box>
			);
		}

		return (
			<ErrorProvider setError={this.setError}>
				{this.props.children}
			</ErrorProvider>
		);
	}
}

ErrorBoundary.propTypes = {
	children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
