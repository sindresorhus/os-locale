'use strict';
var test = require('ava');
var requireUncached = require('require-uncached');
var envVars = ['LC_ALL', 'LANGUAGE', 'LANG', 'LC_MESSAGES'];
var expectedFallback = 'en_US';

function unsetEnvVars(cache) {
	envVars.forEach(function (envVar) {
		if (process.env[envVar]) {
			cache[envVar] = process.env[envVar];
			delete process.env[envVar];
		}
	});
}

function restoreEnvVars(cache) {
	envVars.forEach(function (envVar) {
		if (cache[envVar]) {
			process.env[envVar] = cache[envVar];
		}
	});
}

test('async', function (t) {
	t.plan(3);

	requireUncached('./')(function (err, locale) {
		console.log('Locale identifier:', locale);
		t.error(err);
		t.true(locale.length > 1);
		t.not(locale.indexOf('_'), -1);
	});
});

test('sync', function (t) {
	var locale = requireUncached('./').sync();
	console.log('Locale identifier:', locale);
	t.true(locale.length > 1);
	t.not(locale.indexOf('_'), -1);
	t.end();
});

test.serial('async without spawn', function (t) {
	t.plan(3);

	var beforeTest = {};

	// unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// mock child_process.execFile
	beforeTest.childProcessExecFile = require('child_process').execFile;
	require('child_process').execFile = function () {
		var args = Array.prototype.slice.call(arguments);
		var execFileCb = args[args.length - 1];
		if (typeof execFileCb === 'function') {
			// passing Error here causes osLocale callback not to be called
			execFileCb(null, 'spawn_NOTALLOWED');
		}
	};

	// callback to restore env vars, undo mock, and reload os-locale for subsequent tests
	var afterTest = function () {
		restoreEnvVars(beforeTest);
		require('child_process').execFile = beforeTest.childProcessExecFile;
	};

	// test async method
	requireUncached('./')(function (err, locale) {
		console.log('Locale identifier:', locale);
		afterTest();
		t.error(err);
		t.is(locale, expectedFallback, 'Locale did not match expected fallback');
		t.not(locale, 'spawn_NOTALLOWED', 'Attempted to spawn subprocess');
	}, {spawn: false});
});

test.serial('sync without spawn', function (t) {
	var beforeTest = {};

	// unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// mock exec-file-sync
	beforeTest['exec-file-sync'] = require('exec-file-sync');
	require.cache[require.resolve('exec-file-sync')].exports = function () {
		t.false('Attempted to spawn subprocess');
	};

	// test sync method
	var locale = requireUncached('./').sync({spawn: false});
	console.log('Locale identifier:', locale);
	t.is(locale, expectedFallback, 'Locale did not match expected fallback');

	// restore env vars and undo mock
	restoreEnvVars(beforeTest);
	require.cache[require.resolve('exec-file-sync')].exports = beforeTest['exec-file-sync'];

	t.end();
});
