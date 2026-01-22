#!/usr/bin/env node

// Suppress internal Node.js warnings from being printed to users
// (keeps other warnings like security or custom app warnings visible)
const suppressedWarnings = new Set([
	'DeprecationWarning', // API changes - internal detail
	'ExperimentalWarning', // Experimental features - internal detail
]);

const originalEmit = process.emit;
process.emit = function (event, error) {
	if (event === 'warning' && suppressedWarnings.has(error?.name)) {
		return false;
	}
	return originalEmit.apply(process, arguments);
};

import run from '../dist/main.bundle.js';

run();
