import React from 'react';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Static as InkStatic } from 'ink';
import PropTypes from 'prop-types';

const Static = ({ children }) => {
	return (
		<InkStatic items={[{}]}>
			{() => (
				<React.Fragment key="static-item">{children}</React.Fragment>
			)}
		</InkStatic>
	);
};

Static.propTypes = {
	children: PropTypes.node.isRequired,
};

export default Static;
