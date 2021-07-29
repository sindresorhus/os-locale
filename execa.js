// Mini wrapper around child_process to make it behave a little like execa

const {promisify} = require('util');
const childProcess = require('child_process');

const execFile = promisify(childProcess.execFile);

/**
@param  {string} command
@param  {string[]} args

@returns Promise<import('child_process').ChildProcess>
*/
async function execa(command, args) {
	const child = await execFile(command, args, {encoding: 'utf-8'});
	child.stdout = child.stdout.trim();
	return child;
}

/**
@param  {string} command
@param  {string[]} args

@returns string
*/
function execaSync(command, args) {
	return childProcess.execFileSync(command, args, {encoding: 'utf-8'}).trim();
}

module.exports = execa;
module.exports.sync = execaSync;
