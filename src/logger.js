import chalk from 'chalk';

const logConfig = {
	error: {
		method: 'error',
		style: chalk.red,
		prefix: 'Error:',
	},
	warn: {
		method: 'warn',
		style: chalk.yellow,
		prefix: 'Warning:',
	},
	info: {
		method: 'log',
		style: chalk.blue,
		prefix: 'Info:',
	},
};

const log = Object.keys(logConfig).reduce((acc, key) => {
	const { method, style, prefix } = logConfig[key];

	acc[key] = (...args) => {
		console[method](style(prefix, ...args));
	};

	return acc;
}, {});

export default log;
