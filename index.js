'use strict';
var childProcess = require('child_process');
var execFileSync = childProcess.execFileSync;
var lcid = require('lcid');
var defaultOpts = {spawn: true};
var cache;

function fallback() {
	cache = 'en_US';
	return cache;
}

function getEnvLocale(env) {
	env = env || process.env;
	var ret = env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE;
	cache = getLocale(ret);
	return ret;
}

function parseLocale(x) {
	var env = x.split('\n').reduce(function (env, def) {
		def = def.split('=');
		env[def[0]] = def[1];
		return env;
	}, {});
}

function getLocale(str) {
	return (str && str.replace(/[.:].*/, ''));
}

module.exports = function (opts, cb) {
	if (typeof opts === 'function') {
		cb = opts;
		opts = defaultOpts;
	} else {
		opts = opts || defaultOpts;
	}

	if (cache || getEnvLocale() || opts.spawn === false) {
		setImmediate(cb, null, cache);
		return;
	}

	if (process.platform === 'win32') {
		childProcess.execFile('wmic', ['os', 'get', 'locale'], function (err, stdout) {
			if (err) return;
			var lcidCode = parseInt(stdout.replace('Locale', ''), 16);
			cache = lcid.from(lcidCode);
		});
	} else if (process.platform === 'darwin') {
		childProcess.execFile('defaults', ['read', '-g', 'AppleLocale'], function (err, stdout) {
			if (err) return;
			cache = stdout.trim();
		});
	} else {
		childProcess.execFile('locale', function (err, stdout) {
			if (err) return;
			var res = parseLocale(stdout);
			cache = getLocale(res);
		});
	}
	cb(null, cache || fallback());
};

module.exports.sync = function (opts) {
	opts = opts || defaultOpts;

	if (cache || getEnvLocale() || !execFileSync || opts.spawn === false) {
		return cache;
	}

	try {
		if (process.platform === 'win32') {
			var stdout = execFileSync('wmic', ['os', 'get', 'locale'], {encoding: 'utf8'});
			var lcidCode = parseInt(stdout.replace('Locale', ''), 16);
			cache = lcid.from(lcidCode);
		} else if (process.platform === 'darwin') {
			cache = execFileSync('defaults', ['read', '-g', 'AppleLocale'], {encoding: 'utf8'}).trim();
		} else {
			var res = parseLocale(execFileSync('locale', {encoding: 'utf8'}));
			cache = getLocale(res);
		}
	} catch (err) { }

	return cache || fallback();
};
