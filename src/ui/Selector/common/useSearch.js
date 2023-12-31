import React, { useState, useMemo } from 'react';
import { Text, Box } from 'ink';
import TextInput from 'ink-text-input';
import { getItemName } from './utils';

const useSearch = ({
	items,
	searchable,
	creatable,
	labelKey,
	searchByKey,
	isFocused = true,
}) => {
	const [searchText, setSearchText] = useState('');

	const searchResults = useMemo(() => {
		let baseItems = items;

		// filter out items that don't match the search text
		if (searchable && searchText) {
			baseItems = items.filter((i) =>
				i[searchByKey].includes(searchText)
			);

			// add the search text as a create option if it doesn't exist in the list
			if (creatable) {
				const isInList = baseItems.some(
					(item) => getItemName(item, labelKey) === searchText
				);
				if (!isInList) {
					baseItems.unshift({
						[labelKey]: searchText,
						create: true,
					});
				}
			}
		}

		return baseItems;
	}, [items, labelKey, searchText, searchByKey, creatable, searchable]);

	const searchComponent = useMemo(() => {
		return searchable ? (
			<Box marginBottom={1}>
				<Text>search: </Text>
				<TextInput
					value={searchText}
					onChange={setSearchText}
					focus={isFocused}
				/>
			</Box>
		) : null;
	}, [searchable, searchText, isFocused]);

	return {
		searchResults,
		searchComponent,
	};
};

export default useSearch;
