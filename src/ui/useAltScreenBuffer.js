import { useEffect, useMemo, useCallback } from 'react';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { useStdout } from 'ink';

const enterAltScreenCommand = '\x1b[?1049h';
const leaveAltScreenCommand = '\x1b[?1049l';

const useAltScreenBuffer = () => {
	const { write } = useStdout();

	const openAltScreenBuffer = useCallback(() => {
		write(enterAltScreenCommand);
	}, [write]);

	const closeAltScreenBuffer = useCallback(() => {
		console.log('closeAltScreenBuffer');
		write(leaveAltScreenCommand);
	}, [write]);

	useEffect(() => {
		return () => {
			// Switch back to the normal screen buffer when the component unmounts
			closeAltScreenBuffer();
		};
	}, [closeAltScreenBuffer]);

	return useMemo(
		() => ({ openAltScreenBuffer, closeAltScreenBuffer }),
		[openAltScreenBuffer, closeAltScreenBuffer]
	);
};

export default useAltScreenBuffer;
