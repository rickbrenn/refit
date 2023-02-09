import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Text, Box, useInput } from 'ink';

const Selector = ({ items, onSelect, limit, createOption, labelKey }) => {
	const allItems = useMemo(() => {
		const isInList = items.some((item) => item[labelKey] === createOption);
		if (!createOption || isInList) {
			return items;
		}

		return [
			{
				[labelKey]: createOption,
				create: true,
			},
			...items,
		];
	}, [createOption, items, labelKey]);

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

	return (
		<Box flexDirection="column">
			{visibleItems.map((item, index) => {
				const selected = listIndexes.viewSelected === index;
				const itemName = item[labelKey];

				const baseColor = item.create ? 'green' : undefined;
				const selectedColor = item.create ? baseColor : 'blue';
				const textColor = selected ? selectedColor : baseColor;

				return (
					<Box key={itemName}>
						<Box marginRight={1}>
							<Text color="blue">{selected ? '>' : ' '}</Text>
						</Box>
						{item.create && (
							<Box marginRight={1}>
								<Text color="green">[+]</Text>
							</Box>
						)}
						<Text color={textColor}>{itemName}</Text>
					</Box>
				);
			})}
		</Box>
	);
};

Selector.propTypes = {
	items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	onSelect: PropTypes.func.isRequired,
	limit: PropTypes.number,
	createOption: PropTypes.string,
	labelKey: PropTypes.string,
};

Selector.defaultProps = {
	limit: 0,
	createOption: null,
	labelKey: 'label',
};

export default Selector;
