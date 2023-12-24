import { useState, useMemo } from 'react';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { useInput } from 'ink';

const useListInput = ({
	baseIndex,
	shouldLoop,
	listLength,
	upKey,
	downKey,
	isFocused = true,
}) => {
	const [index, setIndex] = useState(baseIndex || 0);

	useInput(
		(input, key) => {
			// move up the list
			if (upKey ? upKey(input, key) : key.upArrow) {
				setIndex((prev) => {
					if (prev === 0) {
						return shouldLoop ? listLength - 1 : prev;
					}
					return prev - 1;
				});
			}

			// move down the list
			if (downKey ? downKey(input, key) : key.downArrow) {
				setIndex((prev) => {
					if (prev === listLength - 1) {
						return shouldLoop ? 0 : prev;
					}
					return prev + 1;
				});
			}
		},
		{ isActive: isFocused }
	);

	return useMemo(() => [index, setIndex], [index]);
};

export default useListInput;
