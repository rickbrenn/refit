import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Text, Box, useInput } from 'ink';
import inkInput from 'ink-text-input';

const { default: TextInput } = inkInput;

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
}) => {
	const [searchText, setSearchText] = useState('');

	const getItemName = useCallback(
		(item) => (typeof item === 'string' ? item : item[labelKey]),
		[labelKey]
	);

	const allItems = useMemo(() => {
		let baseItems = items;

		// filter out items that don't match the search text
		if (searchable && searchText) {
			baseItems = items.filter((i) =>
				i[searchByKey].includes(searchText)
			);

			// add the search text as a create option if it doesn't exist in the list
			if (creatable) {
				const isInList = baseItems.some(
					(item) => getItemName(item) === searchText
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
	}, [
		items,
		labelKey,
		getItemName,
		searchText,
		searchByKey,
		creatable,
		searchable,
	]);

	const lastItemIndex = allItems.length - 1;
	const limitIndex = limit > 0 ? limit - 1 : lastItemIndex;
	const halfLimitIndex = Math.ceil(limitIndex / 2);

	const initialState = useMemo(
		() => ({
			viewStart: 0,
			viewEnd: limitIndex,
			viewSelected: 0,
			selected: 0,
		}),
		[limitIndex]
	);

	const [listIndexes, setListIndexes] = useState(initialState);

	useInput((input, key) => {
		// select an item in the list
		if (key.return) {
			onSelect(allItems[listIndexes.selected]);
			return;
		}

		// move up the list
		if (key.upArrow) {
			setListIndexes((prev) => {
				const { viewStart, viewEnd, viewSelected, selected } = prev;

				// if we're at the top of the list, go to the bottom
				if (selected === 0) {
					return {
						viewStart: Math.max(0, lastItemIndex - limitIndex),
						viewEnd: lastItemIndex,
						viewSelected: Math.min(lastItemIndex, limitIndex),
						selected: lastItemIndex,
					};
				}

				// if there's a view limit scroll the list view up
				if (limit && viewStart > 0) {
					const middleIndex = viewStart + halfLimitIndex;

					if (selected === middleIndex) {
						return {
							viewStart: viewStart - 1,
							viewEnd: viewEnd - 1,
							viewSelected: halfLimitIndex,
							selected: selected - 1,
						};
					}
				}

				return {
					...prev,
					selected: selected - 1,
					viewSelected: viewSelected - 1,
				};
			});
		}

		// move down the list
		if (key.downArrow) {
			setListIndexes((prev) => {
				const { viewStart, viewEnd, viewSelected, selected } = prev;

				// if we're at the bottom of the list, go to the top
				if (selected === lastItemIndex) {
					return initialState;
				}

				// if there's a view limit scroll the list view down
				if (limit && viewEnd < lastItemIndex) {
					const middleIndex = viewStart + halfLimitIndex;

					if (selected === middleIndex) {
						return {
							viewStart: viewStart + 1,
							viewEnd: viewEnd + 1,
							viewSelected: halfLimitIndex,
							selected: selected + 1,
						};
					}
				}

				return {
					...prev,
					selected: selected + 1,
					viewSelected: viewSelected + 1,
				};
			});
		}
	});

	useEffect(() => {
		// reset the highlighted index when the items or limit change
		setListIndexes(initialState);
	}, [allItems, initialState]);

	const visibleItems = useMemo(() => {
		if (!limit) {
			return allItems;
		}

		return allItems.slice(listIndexes.viewStart, listIndexes.viewEnd + 1);
	}, [limit, allItems, listIndexes]);

	const titleComponent = useMemo(() => {
		if (renderTitle) {
			return renderTitle();
		}

		if (title) {
			return (
				<Box marginBottom={1}>
					<Text>{title}</Text>
				</Box>
			);
		}

		return null;
	}, [title, renderTitle]);

	return (
		<Box flexDirection="column" marginTop={1} marginBottom={1}>
			{titleComponent}
			{searchable && (
				<Box marginBottom={1}>
					<Text>search: </Text>
					<TextInput value={searchText} onChange={setSearchText} />
				</Box>
			)}
			<Box flexDirection="column">
				{visibleItems.map((item, index) => {
					const selected = listIndexes.viewSelected === index;
					const itemName = getItemName(item);
					const textColor = selected ? 'blue' : undefined;

					let itemComp = <Text color={textColor}>{itemName}</Text>;

					if (item.create) {
						itemComp = (
							<Box>
								<Box marginRight={1}>
									<Text color="green">[+]</Text>
								</Box>
								<Text color="green">{itemName}</Text>
							</Box>
						);
					} else if (renderItem) {
						itemComp = renderItem(item, selected, textColor);
					}

					return (
						<Box key={itemName}>
							<Box marginRight={1}>
								<Text color="blue">{selected ? '❯' : ' '}</Text>
							</Box>
							{itemComp}
						</Box>
					);
				})}
			</Box>
		</Box>
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
};

export default Selector;
