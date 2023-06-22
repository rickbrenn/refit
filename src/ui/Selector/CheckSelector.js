import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useInput } from 'ink';
import List from './common/List';
import useListView from './common/useListView';

const CheckSelector = ({
	items,
	onSelect,
	limit,
	labelKey,
	title,
	renderTitle,
	// searchable,
	// searchByKey,
	renderItem,
	renderHighlighter,
	renderSelector,
	defaultSelected,
}) => {
	// const { searchResults, searchComponent } = useSearch({
	// 	items,
	// 	searchable,
	// 	creatable: false,
	// 	labelKey,
	// 	searchByKey,
	// });
	const { highlightedIndex, visibleItems, getIndex } = useListView({
		items,
		limit,
	});
	const [selectedIndexes, setSelectedIndexes] = useState(defaultSelected);

	useInput((input, key) => {
		// select an item in the list
		if (key.return) {
			onSelect(selectedIndexes.map((i) => items[i]));
			return;
		}

		// select or deselect an item
		if (input === ' ') {
			setSelectedIndexes((prev) => {
				if (prev.includes(highlightedIndex)) {
					return prev.filter((i) => i !== highlightedIndex);
				}
				return [...prev, highlightedIndex];
			});
		}

		// select all items
		if (input === 'a') {
			setSelectedIndexes((prev) => {
				if (prev.length === items.length) {
					return [];
				}
				return items.map((_, index) => index);
			});
		}
	});

	return (
		<List
			title={title}
			renderTitle={renderTitle}
			renderHighlighter={renderHighlighter}
			renderSelector={renderSelector}
			// searchComponent={searchComponent}
			items={visibleItems}
			getIndex={getIndex}
			highlightedIndex={highlightedIndex}
			labelKey={labelKey}
			selectedIndexes={selectedIndexes}
			renderItem={renderItem}
			selectable
			creatable={false}
		/>
	);
};

CheckSelector.propTypes = {
	items: PropTypes.arrayOf(
		PropTypes.oneOfType([PropTypes.shape({}), PropTypes.string])
	).isRequired,
	onSelect: PropTypes.func.isRequired,
	limit: PropTypes.number,
	labelKey: PropTypes.string,
	title: PropTypes.string,
	renderTitle: PropTypes.func,
	// searchable: PropTypes.bool,
	// searchByKey: PropTypes.string,
	renderItem: PropTypes.func,
	renderHighlighter: PropTypes.func,
	renderSelector: PropTypes.func,
	defaultSelected: PropTypes.arrayOf(PropTypes.number),
};

CheckSelector.defaultProps = {
	limit: 0,
	labelKey: 'label',
	title: '',
	renderTitle: null,
	// searchable: false,
	// searchByKey: 'label',
	renderItem: null,
	renderHighlighter: null,
	renderSelector: null,
	defaultSelected: [],
};

export default CheckSelector;
