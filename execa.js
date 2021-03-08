// Mini wrapper around child_process to make it behave a little like execa

const {promisify} = require('util');
const childProcess = require('child_process');

module.exports = promisify(childProcess.execFile).then(value => {
	value.stdout = value.stdout.trim();
	return value;
});

module.exports.sync = () => {
	const value = childProcess.sync();
	value.stdout = value.stdout.trim();
	return value;
};
