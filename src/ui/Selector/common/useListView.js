import { useMemo, useEffect, useCallback } from 'react';
import useListInput from '../../useListInput';

const useListView = ({ items, limit, isFocused }) => {
	const [highlightedIndex, setHighlightedIndex] = useListInput({
		baseIndex: 0,
		shouldLoop: true,
		listLength: items.length,
		isFocused,
	});

	// TODO: update this, and the Selector component in general, to not need
	// `items` and `setHighlightedIndex` to be memoized
	useEffect(() => {
		// reset the highlighted index when the items change
		setHighlightedIndex(0);
	}, [items, setHighlightedIndex]);

	const visible = useMemo(() => {
		if (!limit) {
			return {
				items,
				indexes: Array.from(items.keys()),
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

	const canScroll = useMemo(() => {
		return {
			up: !visible.indexes.includes(0),
			down: !visible.indexes.includes(items.length - 1),
		};
	}, [visible.indexes, items.length]);

	return {
		highlightedIndex,
		visibleItems: visible.items,
		getIndex,
		canScroll,
	};
};

export default useListView;
