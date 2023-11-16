import { spawn } from 'child_process';

// spawn a command and return results in a promise
const spawnAsync = async (command) => {
	const [cmd, ...args] = command.split(' ');
	const childProcess = spawn(cmd, args);

	const stdout = [];
	const stderr = [];

	return new Promise((resolve, reject) => {
		childProcess.stdout.on('data', (data) => {
			stdout.push(data.toString());
		});
		childProcess.stderr.on('data', (data) => {
			stderr.push(data.toString());
		});

		childProcess.on('close', () => {
			if (stderr.length) {
				reject(stderr.join(''));
			} else {
				resolve(stdout.join(''));
			}
		});
	});
};

export default spawnAsync;
