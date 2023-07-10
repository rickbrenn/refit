import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box } from 'ink';
import { getItemName } from './utils';

const List = ({
	title,
	renderTitle,
	searchComponent,
	items,
	getIndex,
	highlightedIndex,
	labelKey,
	selectedIndexes,
	renderItem,
	selectable,
	creatable,
	renderHighlighter,
	renderSelector,
	itemKey,
}) => {
	const isSelected = (index) => selectable && selectedIndexes.includes(index);

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
		<Box flexDirection="column">
			{titleComponent}
			{searchComponent}
			<Box flexDirection="column">
				{items.map((item, index) => {
					/*
						const { actualIndex, itemName, highlighted, selected } = getItemInfo(item, index);
					*/
					const actualIndex = getIndex(index);
					const highlighted = actualIndex === highlightedIndex;
					const itemName = getItemName(item, labelKey);
					const textColor = highlighted ? 'blue' : undefined;
					const key = itemKey ? item[itemKey] : itemName;

					const selected = isSelected(actualIndex);

					let itemComp = <Text color={textColor}>{itemName}</Text>;

					if (item.create && creatable) {
						itemComp = (
							<Box>
								<Box marginRight={1}>
									<Text color="green">[+]</Text>
								</Box>
								<Text color="green">{itemName}</Text>
							</Box>
						);
					} else if (renderItem) {
						itemComp = renderItem(
							item,
							highlighted,
							selected,
							textColor
						);
					}

					let highlightComp = (
						<Text color="blue">{highlighted ? '❯' : ' '}</Text>
					);

					if (renderHighlighter) {
						highlightComp = renderHighlighter(item, highlighted);
					}

					let selectorComp = <Text>{selected ? '◉' : '◯'}</Text>;

					if (renderSelector) {
						selectorComp = renderSelector(item, selected);
					}

					return (
						<Box key={key}>
							<Box marginRight={1}>{highlightComp}</Box>
							{selectable && (
								<Box marginRight={1}>{selectorComp}</Box>
							)}
							{itemComp}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};

List.propTypes = {
	items: PropTypes.arrayOf(
		PropTypes.oneOfType([PropTypes.shape({}), PropTypes.string])
	).isRequired,
	labelKey: PropTypes.string,
	title: PropTypes.string,
	renderTitle: PropTypes.func,
	renderItem: PropTypes.func,
	searchComponent: PropTypes.node,
	getIndex: PropTypes.func.isRequired,
	highlightedIndex: PropTypes.number.isRequired,
	selectedIndexes: PropTypes.arrayOf(PropTypes.number),
	selectable: PropTypes.bool,
	creatable: PropTypes.bool,
	renderHighlighter: PropTypes.func,
	renderSelector: PropTypes.func,
	itemKey: PropTypes.string,
};

List.defaultProps = {
	labelKey: 'label',
	title: '',
	renderTitle: null,
	renderItem: null,
	searchComponent: null,
	selectedIndexes: [],
	selectable: false,
	creatable: false,
	renderHighlighter: null,
	renderSelector: null,
	itemKey: null,
};

export default List;
