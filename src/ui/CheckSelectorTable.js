import React from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-unresolved, node/no-missing-import
import { Text, Box } from 'ink';
import { getColumnsWidth } from './Table';
import CheckSelector from './Selector/CheckSelector';

const CheckSelectorTable = ({
	data,
	columns,
	columnGap,
	borderColor,
	maxColumnWidths,
	onSelect,
	limit,
	labelKey,
	defaultSelected,
	itemKey,
}) => {
	const columnWidths = getColumnsWidth({
		data,
		columns,
		columnGap,
		maxColumnWidths,
	});

	return (
		<Box>
			<Box
				flexDirection="column"
				paddingX={2}
				borderStyle="round"
				borderColor={borderColor}
			>
				<Box marginLeft={columnGap}>
					{columns.map((c) => (
						<Box
							key={c.name}
							width={columnWidths[c.accessor].width}
							minWidth={columnWidths[c.accessor].minWidth}
						>
							<Text color={c.color} wrap={c.wrap}>
								{c.name}
							</Text>
						</Box>
					))}
				</Box>

				<CheckSelector
					items={data}
					itemKey={itemKey}
					onSelect={onSelect}
					limit={limit}
					labelKey={labelKey}
					defaultSelected={defaultSelected}
					renderItem={(item) => {
						return (
							<Box>
								{columns.map((c) => (
									<Box
										key={c.name}
										width={columnWidths[c.accessor].width}
										minWidth={
											columnWidths[c.accessor].minWidth
										}
									>
										{c.Component ? (
											<c.Component
												row={item}
												column={c}
											/>
										) : (
											<Text wrap={c.wrap}>
												{item[c.accessor]}
											</Text>
										)}
									</Box>
								))}
							</Box>
						);
					}}
				/>
			</Box>
		</Box>
	);
};

CheckSelectorTable.propTypes = {
	data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	borderColor: PropTypes.string,
	maxColumnWidths: PropTypes.shape({}),
	columnGap: PropTypes.number,
	onSelect: PropTypes.func.isRequired,
	limit: PropTypes.number,
	labelKey: PropTypes.string,
	defaultSelected: PropTypes.arrayOf(PropTypes.number),
	itemKey: PropTypes.string,
};

CheckSelectorTable.defaultProps = {
	borderColor: 'blue',
	maxColumnWidths: null,
	columnGap: 4,
	limit: 0,
	labelKey: 'label',
	defaultSelected: [],
	itemKey: null,
};

export default CheckSelectorTable;
