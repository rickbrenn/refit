import { useState, useRef, useCallback, useEffect } from 'react';
import { measureElement } from 'ink';

const useComponentSize = () => {
	const ref = useRef();
	const [size, setSize] = useState({ height: 0, width: 0 });

	const measure = useCallback(() => {
		if (ref.current) {
			setSize(measureElement(ref.current));
		}
	}, []);

	useEffect(() => {
		measure();
	}, [measure]);

	return [ref, size, measure];
};

export default useComponentSize;
