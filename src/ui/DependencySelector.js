import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import inkInput from 'ink-text-input';
import Selector from './Selector';

const { default: TextInput } = inkInput;

const DependencySelector = ({ items, onSelect, searchByKey }) => {
	const [searchText, setSearchText] = useState('');

	const filteredItems = useMemo(() => {
		if (!searchText) {
			return items;
		}

		return items.filter((item) => item[searchByKey].includes(searchText));
	}, [items, searchText, searchByKey]);

	return (
		<Box flexDirection="column" marginTop={1} marginBottom={1}>
			<Box marginBottom={1}>
				<Text>Select a package below to add or update</Text>
			</Box>
			<Box marginBottom={1}>
				<Text>search: </Text>
				<TextInput value={searchText} onChange={setSearchText} />
			</Box>
			<Selector
				items={filteredItems}
				onSelect={onSelect}
				limit={8}
				createOption={searchText}
				labelKey={searchByKey}
			/>
		</Box>
	);
};

DependencySelector.propTypes = {
	items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	onSelect: PropTypes.func.isRequired,
	searchByKey: PropTypes.string,
};

DependencySelector.defaultProps = {
	searchByKey: 'label',
};

export default DependencySelector;
