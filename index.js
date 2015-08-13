'use strict';
var childProcess = require('child_process');
var execFileSync = require('exec-file-sync');
var lcid = require('lcid');
var cache;

function getLocale(str) {
	return str.replace(/[.:].*/, '') || 'en_US';
}

module.exports = function (cb) {
	if (cache) {
		setImmediate(cb, null, cache);
		return;
	}

	var env = process.env;
	var locale = env.LC_ALL || env.LANGUAGE || env.LANG || env.LC_MESSAGES;

	if (locale) {
		cache = getLocale(locale);
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

			var res = /(?:LC_ALL|LANG|LC_MESSAGES|LC_CTYPE|)="([^"]{2,})"/.exec(stdout);

			if (!res && process.platform === 'darwin') {
				getAppleLocale();
				return;
			}

			cache = getLocale(res && res[1]);
			cb(null, cache);
		});
	}
};

module.exports.sync = function () {
	if (cache) {
		return cache;
	}

	var env = process.env;
	var locale = env.LC_ALL || env.LANGUAGE || env.LANG || env.LC_MESSAGES;

	if (locale) {
		cache = getLocale(locale);
		return cache;
	}

	var stdout = process.platform === 'win32' ?
		execFileSync('wmic', ['os', 'get', 'locale'], {encoding: 'utf8'}) :
		execFileSync('locale', {encoding: 'utf8'});

	var getAppleLocale = function () {
		cache = execFileSync('defaults', ['read', '-g', 'AppleLocale']).strim() || 'en_US';
		return cache;
	};

	if (process.platform === 'win32') {
		var lcidCode = parseInt(stdout.replace('Locale', ''), 16);
		cache = lcid.from(lcidCode) || 'en_US';
		return cache;
	}

	var res = /(?:LC_ALL|LANG|LC_MESSAGES|LC_CTYPE|)="([^"]{2,})"/.exec(stdout);

	if (!res && process.platform === 'darwin') {
		return getAppleLocale();
	}

	cache = getLocale(res && res[1]);
	return cache;
};
