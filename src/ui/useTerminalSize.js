import { useEffect, useCallback, useState } from 'react';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { useStdout } from 'ink';

const useTerminalSize = () => {
	const { stdout } = useStdout();

	const getTerminalSize = useCallback(
		() => ({
			height: stdout.rows,
			width: stdout.columns,
		}),
		[stdout]
	);

	const [terminalSize, setTerminalSize] = useState(getTerminalSize);

	const onResize = useCallback(() => {
		setTerminalSize(getTerminalSize);
	}, [getTerminalSize]);

	useEffect(() => {
		stdout.on('resize', onResize);
		return () => {
			stdout.off('resize', onResize);
		};
	}, [stdout, onResize]);

	return terminalSize;
};

export default useTerminalSize;
