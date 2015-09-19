'use strict';
var test = require('ava');
var requireUncached = require('require-uncached');
var childProcess = require('child_process');
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
	beforeTest.childProcessExecFile = childProcess.execFile;
	childProcess.execFile = function () {
		var args = Array.prototype.slice.call(arguments);
		var execFileCb = args[args.length - 1];
		if (typeof execFileCb === 'function') {
			// passing Error here causes osLocale callback not to be called
			execFileCb(null, 'spawn_NOTALLOWED');
		}
	};

	// callback to restore env vars and undo mock
	var afterTest = function () {
		restoreEnvVars(beforeTest);
		childProcess.execFile = beforeTest.childProcessExecFile;
	};

	// test async method
	requireUncached('./')({spawn: false}, function (err, locale) {
		console.log('Locale identifier:', locale);
		afterTest();
		t.error(err);
		t.is(locale, expectedFallback, 'Locale did not match expected fallback');
		t.not(locale, 'spawn_NOTALLOWED', 'Attempted to spawn subprocess');
	});
});

test.serial('sync without spawn', function (t) {
	var beforeTest = {};

	// unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// mock child_process.execFileSync
	if (childProcess.execFileSync) {
		beforeTest.childProcessExecFileSync = childProcess.execFileSync;
		childProcess.execFileSync = function () {
			t.false('Attempted to spawn subprocess');
		};
	}

	// test sync method
	var locale = requireUncached('./').sync({spawn: false});
	console.log('Locale identifier:', locale);
	t.is(locale, expectedFallback, 'Locale did not match expected fallback');

	// restore env vars and undo mock
	restoreEnvVars(beforeTest);
	if (beforeTest.childProcessExecFileSync) {
		childProcess.execFileSync = beforeTest.childProcessExecFileSync;
	}

	t.end();
});
