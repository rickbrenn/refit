import React from 'react';
import PropTypes from 'prop-types';
import { Text, Box } from 'ink';
import { getColumnsWidth } from './Table';
import CheckSelector from './Selector/CheckSelector';

const defaultDefaultSelected = [];

const CheckSelectorTable = ({
	data,
	columns,
	columnGap = 4,
	borderColor = 'blue',
	maxColumnWidths = undefined,
	onSelect,
	limit = 0,
	labelKey = 'label',
	defaultSelected = defaultDefaultSelected,
	itemKey = undefined,
	inputHandler = undefined,
	isFocused = true,
}) => {
	const columnWidths = getColumnsWidth({
		data,
		columns,
		columnGap,
		maxColumnWidths,
	});

	const renderPagination = ({ viewIndex, canScroll, total }) => {
		let paginationIcon = ' ';
		if (viewIndex === 0 && canScroll.up) {
			paginationIcon = '▲';
		}

		if (viewIndex === total - 1 && canScroll.down) {
			paginationIcon = '▼';
		}

		return <Text color="blue">{paginationIcon}</Text>;
	};

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
					renderItem={({ item, canScroll, viewIndex, items }) => {
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
								{(canScroll.up || canScroll.down) &&
									renderPagination({
										viewIndex,
										canScroll,
										total: items.length,
									})}
							</Box>
						);
					}}
					inputHandler={inputHandler}
					isFocused={isFocused}
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
	inputHandler: PropTypes.func,
	isFocused: PropTypes.bool,
};

export default CheckSelectorTable;
