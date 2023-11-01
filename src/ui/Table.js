import React from 'react';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box } from 'ink';
import PropTypes from 'prop-types';

const calculateColumnWidths = ({ data, columns }) => {
	const minColumnWidths = columns.reduce((acc, curr) => {
		acc[curr.accessor] = curr.name.length;
		return acc;
	}, {});

	const maxColumnWidths = data.reduce((acc, curr) => {
		Object.keys(curr).forEach((dataKey) => {
			const prevWidth = acc[dataKey] || 0;
			const currWidth = curr[dataKey]?.length || 0;

			acc[dataKey] = currWidth > prevWidth ? currWidth : prevWidth;
		});

		return acc;
	}, minColumnWidths);

	return { min: minColumnWidths, max: maxColumnWidths };
};

const Table = ({ data, columns, borderColor, maxColumnWidths }) => {
	let columnWidths = maxColumnWidths;
	if (!columnWidths) {
		columnWidths = calculateColumnWidths({ data, columns }).max;
	}

	const columnsConfig = columns.map((c) => {
		const columnGap = 4;

		const width = c.width || columnWidths[c.accessor];
		return {
			...c,
			width: width + columnGap,
			baseWidth: width,
		};
	});

	return (
		<Box
			flexDirection="column"
			paddingX={2}
			borderStyle="round"
			borderColor={borderColor}
		>
			<Box>
				{columnsConfig.map((c) => (
					<Box
						key={c.name}
						width={c.width}
						minWidth={c.noWrap && c.baseWidth}
					>
						<Text color={c.color} wrap={c.wrap}>
							{c.name}
						</Text>
					</Box>
				))}
			</Box>

			{data.map((d) => (
				<Box key={d.key}>
					{columnsConfig.map((c) => (
						<Box
							key={c.name}
							width={c.width}
							minWidth={c.noWrap && c.baseWidth}
						>
							{c.Component ? (
								<c.Component row={d} column={c} />
							) : (
								<Text wrap={c.wrap}>{d[c.accessor]}</Text>
							)}
						</Box>
					))}
				</Box>
			))}
		</Box>
	);
};

Table.propTypes = {
	data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	borderColor: PropTypes.string,
	maxColumnWidths: PropTypes.shape({}),
};

Table.defaultProps = {
	borderColor: 'blue',
	maxColumnWidths: null,
};

export default Table;
export { calculateColumnWidths };
