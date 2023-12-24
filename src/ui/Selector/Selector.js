import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { useInput } from 'ink';
import List from './common/List';
import useListView from './common/useListView';
import useSearch from './common/useSearch';

const Selector = ({
	items,
	onSelect,
	limit,
	labelKey,
	title,
	renderTitle,
	searchable,
	searchByKey,
	creatable,
	renderItem,
	renderHighlighter,
	renderSelector,
	inputHandler,
	itemKey,
	isFocused,
}) => {
	const { searchResults, searchComponent } = useSearch({
		items,
		searchable,
		creatable,
		labelKey,
		searchByKey,
		isFocused,
	});
	const { highlightedIndex, visibleItems, getIndex } = useListView({
		items: searchResults,
		limit,
		isFocused,
	});

	useInput(
		(input, key) => {
			// select an item in the list
			if (key.return) {
				onSelect(searchResults[highlightedIndex]);
			}

			if (inputHandler) {
				inputHandler(
					{ input, key },
					{
						index: highlightedIndex,
						item: searchResults[highlightedIndex],
					}
				);
			}
		},
		{ isActive: isFocused }
	);

	return (
		<List
			title={title}
			renderTitle={renderTitle}
			renderHighlighter={renderHighlighter}
			renderSelector={renderSelector}
			searchComponent={searchComponent}
			items={visibleItems}
			getIndex={getIndex}
			highlightedIndex={highlightedIndex}
			labelKey={labelKey}
			renderItem={renderItem}
			selectable={false}
			creatable
			itemKey={itemKey}
		/>
	);
};

Selector.propTypes = {
	items: PropTypes.arrayOf(
		PropTypes.oneOfType([PropTypes.shape({}), PropTypes.string])
	).isRequired,
	onSelect: PropTypes.func.isRequired,
	limit: PropTypes.number,
	labelKey: PropTypes.string,
	title: PropTypes.string,
	renderTitle: PropTypes.func,
	searchable: PropTypes.bool,
	searchByKey: PropTypes.string,
	creatable: PropTypes.bool,
	renderItem: PropTypes.func,
	renderHighlighter: PropTypes.func,
	renderSelector: PropTypes.func,
	inputHandler: PropTypes.func,
	itemKey: PropTypes.string,
	isFocused: PropTypes.bool,
};

Selector.defaultProps = {
	limit: 0,
	labelKey: 'label',
	title: '',
	renderTitle: null,
	searchable: false,
	searchByKey: 'label',
	creatable: false,
	renderItem: null,
	renderHighlighter: null,
	renderSelector: null,
	inputHandler: null,
	itemKey: null,
	isFocused: true,
};

export default Selector;
