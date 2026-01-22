const getItemName = (item, key) =>
	typeof item === 'string' ? item : item[key];

// eslint-disable-next-line import-x/prefer-default-export
export { getItemName };
