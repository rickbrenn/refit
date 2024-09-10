import { spawn } from 'child_process';

// spawn a command and return results in a promise
const spawnAsync = async (command, spawnOptions) => {
	const [cmd, ...args] = command.split(' ');
	const childProcess = spawn(cmd, args, spawnOptions);

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
			// handle process that exits with an error but doesn't write to stderr
			// this app uses a custom error boundary that writes to stdout (maybe that should be changed)
			if (code !== 0 && !stderr.length) {
				reject(stdout.join(''));
			}

			if (stderr.length) {
				reject(stderr.join(''));
			} else {
				resolve(stdout.join(''));
			}
		});
	});
};

export default spawnAsync;
