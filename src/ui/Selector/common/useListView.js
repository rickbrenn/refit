import { useState, useMemo, useEffect, useCallback } from 'react';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { useInput } from 'ink';

const useListView = ({ items, limit }) => {
	const [highlightedIndex, setHighlightedIndex] = useState(0);

	useInput((input, key) => {
		// move up the list
		if (key.upArrow) {
			setHighlightedIndex((prev) => {
				if (prev === 0) {
					return items.length - 1;
				}
				return prev - 1;
			});
		}

		// move down the list
		if (key.downArrow) {
			setHighlightedIndex((prev) => {
				if (prev === items.length - 1) {
					return 0;
				}
				return prev + 1;
			});
		}
	});

	useEffect(() => {
		// reset the highlighted index when the items change
		setHighlightedIndex(0);
	}, [items]);

	const visible = useMemo(() => {
		if (!limit) {
			return {
				items,
				indexes: Array(items).keys(),
			};
		}

		const viewLimit = Math.min(limit, items.length);
		let viewStart = Math.max(
			0,
			highlightedIndex - Math.floor(viewLimit / 2)
		);
		const viewEnd = Math.min(items.length - 1, viewStart + viewLimit - 1);
		viewStart = Math.min(viewStart, viewEnd - viewLimit + 1);

		const visibleItems = items.slice(viewStart, viewEnd + 1);
		const visibleItemsIndexes = Array.from(
			{ length: viewLimit },
			(v, i) => viewStart + i
		);

		return {
			items: visibleItems,
			indexes: visibleItemsIndexes,
		};
	}, [highlightedIndex, limit, items]);

	const getIndex = useCallback(
		(index) => (visible.indexes.length ? visible.indexes[index] : index),
		[visible.indexes]
	);

	return {
		highlightedIndex,
		visibleItems: visible.items,
		getIndex,
	};
};

export default useListView;
