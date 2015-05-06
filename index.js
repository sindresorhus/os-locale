'use strict';
var childProcess = require('child_process');
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

			cache = getLocale(res && res[1]);
			cb(null, cache);
		});
	}
};
