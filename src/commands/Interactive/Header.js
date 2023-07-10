import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box } from 'ink';

const Header = ({ wizardState }) => {
	const headerConfig = [
		{
			title: 'Selected Dependency:',
			value: wizardState?.dependency,
		},
		{
			title: 'Selected Version:',
			value: wizardState?.version,
		},
	];

	return (
		<Box
			flexDirection="column"
			marginBottom={headerConfig.some(({ value }) => !!value) ? 1 : 0}
		>
			{headerConfig.map((result) => {
				return result.value ? (
					<Box flexDirection="row" key={result.value}>
						<Box marginRight={1}>
							<Text bold>{result.title}</Text>
						</Box>
						<Text color="green">{result.value}</Text>
					</Box>
				) : null;
			})}
		</Box>
	);
};

Header.propTypes = {
	wizardState: PropTypes.shape({
		dependency: PropTypes.string,
		version: PropTypes.string,
	}).isRequired,
};

export default Header;
