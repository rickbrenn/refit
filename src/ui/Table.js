import React from 'react';
import { Text, Box } from 'ink';
import PropTypes from 'prop-types';

const getColumnsMinMax = ({ data, columns }) => {
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

const getColumnsWidth = ({ data, columns, columnGap, maxColumnWidths }) => {
	const { max } = getColumnsMinMax({ data, columns });
	const maxOverride = maxColumnWidths || {};

	return columns.reduce((acc, c) => {
		const width = c.width || maxOverride[c.accessor] || max[c.accessor];

		acc[c.accessor] = {
			width: width + columnGap,
			minWidth: c.noWrap ? c.width : undefined,
		};
		return acc;
	}, {});
};

const Table = ({ data, columns, columnGap, borderColor, maxColumnWidths }) => {
	const columnWidths = getColumnsWidth({
		data,
		columns,
		columnGap,
		maxColumnWidths,
	});

	return (
		<Box
			flexDirection="column"
			paddingX={2}
			borderStyle="round"
			borderColor={borderColor}
		>
			<Box>
				{columns.map((c) => {
					const { width, minWidth } = columnWidths[c.accessor];

					return (
						<Box key={c.name} width={width} minWidth={minWidth}>
							<Text color={c.color} wrap={c.wrap}>
								{c.name}
							</Text>
						</Box>
					);
				})}
			</Box>

			{data.map((d) => (
				<Box key={d.key}>
					{columns.map((c) => {
						const { width, minWidth } = columnWidths[c.accessor];

						return (
							<Box key={c.name} width={width} minWidth={minWidth}>
								{c.Component ? (
									<c.Component row={d} column={c} />
								) : (
									<Text wrap={c.wrap}>{d[c.accessor]}</Text>
								)}
							</Box>
						);
					})}
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
	columnGap: PropTypes.number,
};

Table.defaultProps = {
	borderColor: 'blue',
	maxColumnWidths: null,
	columnGap: 4,
};

export default Table;
export { getColumnsMinMax, getColumnsWidth };
