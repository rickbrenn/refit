import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Text, useApp } from 'ink';
import { ErrorProvider } from './ErrorProvider';

const AppExit = ({ error, children }) => {
	const { exit } = useApp();

	useEffect(() => {
		exit(error);
	}, [exit, error]);

	return children;
};

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
				<AppExit error={error}>
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
				</AppExit>
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
