import React from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';

const Header = ({ wizardState }) => {
	const headerConfig = [
		{
			title: 'Selected Dependency:',
			value: wizardState?.dependency?.name,
		},
		{
			title: 'Selected Version:',
			value: wizardState?.version,
		},
		{
			title: 'Selected Packages:',
			value: wizardState?.packages
				?.reduce((acc, { name, type }) => {
					if (type) {
						acc.push(`${name}:${type}`);
					} else {
						acc.push(name);
					}

					return acc;
				}, [])
				?.join(', '),
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
		dependency: PropTypes.shape({ name: PropTypes.string }),
		version: PropTypes.string,
		packages: PropTypes.arrayOf(
			PropTypes.shape({
				name: PropTypes.string,
				type: PropTypes.string,
			})
		),
	}).isRequired,
};

export default Header;
