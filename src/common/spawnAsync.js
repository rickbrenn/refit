import { spawn } from 'node:child_process';

// spawn a command and return results in a promise
const spawnAsync = async (command, spawnOptions = {}) => {
	// Pass entire command to shell - shell handles parsing
	const childProcess = spawn(command, [], { ...spawnOptions, shell: true });

	const stdout = [];
	const stderr = [];

	return new Promise((resolve, reject) => {
		childProcess.stdout.on('data', (data) => {
			stdout.push(data.toString());
		});
		childProcess.stderr.on('data', (data) => {
			stderr.push(data.toString());
		});

		childProcess.on('close', (code) => {
			if (code !== 0) {
				// Prefer stderr for error message, fall back to stdout
				// (this app uses a custom error boundary that writes to stdout)
				reject(stderr.length ? stderr.join('') : stdout.join(''));
			} else {
				resolve(stdout.join(''));
			}
		});
	});
};

export default spawnAsync;
