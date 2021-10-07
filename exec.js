// Mini wrapper around `child_process` to make it behave a little like `execa`.

import {promisify} from 'node:util';
import childProcess from 'node:child_process';

const execFile = promisify(childProcess.execFile);

/**
@param {string} command
@param {string[]} arguments_

@returns {Promise<import('child_process').ChildProcess>}
*/
export async function exec(command, arguments_) {
	const subprocess = await execFile(command, arguments_, {encoding: 'utf8'});
	subprocess.stdout = subprocess.stdout.trim();
	return subprocess;
}

/**
@param {string} command
@param {string[]} arguments_

@returns {string}
*/
export function execSync(command, arguments_) {
	return childProcess.execFileSync(command, arguments_, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore'],
	}).trim();
}
