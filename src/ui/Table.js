import React from 'react';
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

	return { minColumnWidths, maxColumnWidths };
};

const Table = ({ data, columns }) => {
	const { maxColumnWidths } = calculateColumnWidths({
		data,
		columns,
	});

	const columnsConfig = columns.map((c) => {
		const columnGap = 4;

		const width = c.width || maxColumnWidths[c.accessor];
		return {
			...c,
			width: width + columnGap,
			baseWidth: width,
		};
	});

	return (
		<Box marginBottom={1}>
			<Box
				flexDirection="column"
				paddingX={2}
				borderStyle="round"
				borderColor="green"
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
					<Box key={d.name + d.in}>
						{columnsConfig.map((c) => (
							<Box
								key={c.name}
								width={c.width}
								minWidth={c.noWrap && c.baseWidth}
							>
								{c.Component ? (
									<c.Component row={d} />
								) : (
									<Text wrap={c.wrap}>{d[c.accessor]}</Text>
								)}
							</Box>
						))}
					</Box>
				))}
			</Box>
		</Box>
	);
};

Table.propTypes = {
	data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

export default Table;
