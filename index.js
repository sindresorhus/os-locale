'use strict';
var childProcess = require('child_process');
var execFileSync = require('exec-file-sync');
var lcid = require('lcid');
var cache;

function getEnvLocale() {
	var env = process.env;
	var ret = env.LC_ALL || env.LANGUAGE || env.LANG || env.LC_MESSAGES;
	cache = getLocale(ret);
	return ret;
}

function parseLocale(x) {
	var res = /(?:LC_ALL|LANG|LC_MESSAGES|LC_CTYPE|)="([^"]{2,})"/.exec(x);
	return res && res[1];
}

function getLocale(str) {
	return (str && str.replace(/[.:].*/, '')) || 'en_US';
}

module.exports = function (cb) {
	if (cache || getEnvLocale()) {
		setImmediate(cb, null, cache);
		return;
	}

	var getAppleLocale = function () {
		childProcess.execFile('defaults', ['read', '-g', 'AppleLocale'], function (err, stdout) {
			if (err) {
				cb(err);
				return;
			}

			cache = stdout.trim() || 'en_US';
			cb(null, cache);
		});
	};

	if (process.platform === 'win32') {
		childProcess.execFile('wmic', ['os', 'get', 'locale'], function (err, stdout) {
			if (err) {
				cb(err);
				return;
			}

			var lcidCode = parseInt(stdout.replace('Locale', ''), 16);
			cache = lcid.from(lcidCode) || 'en_US';
			cb(null, cache);
		});
	} else {
		childProcess.execFile('locale', function (err, stdout) {
			if (err) {
				cb(err);
				return;
			}

			var res = parseLocale(stdout);

			if (!res && process.platform === 'darwin') {
				getAppleLocale();
				return;
			}

			cache = getLocale(res);
			cb(null, cache);
		});
	}
};

module.exports.sync = function () {
	if (cache || getEnvLocale()) {
		return cache;
	}

	if (process.platform === 'win32') {
		var stdout = execFileSync('wmic', ['os', 'get', 'locale'], {encoding: 'utf8'});
		var lcidCode = parseInt(stdout.replace('Locale', ''), 16);
		cache = lcid.from(lcidCode) || 'en_US';
		return cache;
	}

	var res = parseLocale(execFileSync('locale', {encoding: 'utf8'}));

	if (!res && process.platform === 'darwin') {
		cache = execFileSync('defaults', ['read', '-g', 'AppleLocale'], {encoding: 'utf8'}).trim() || 'en_US';
		return cache;
	}

	cache = getLocale(res);
	return cache;
};
