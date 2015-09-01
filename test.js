'use strict';
var test = require('ava');
var osLocale = require('./');
var envVars = ['LC_ALL', 'LANGUAGE', 'LANG', 'LC_MESSAGES'];
var expectedFallback = 'en_US';

function reloadOsLocale() {
	delete require.cache[require.resolve('./')];
	osLocale = require('./');
}

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

	osLocale(function (err, locale) {
		console.log('Locale identifier:', locale);
		t.assert(!err, err);
		t.assert(locale.length > 1);
		t.assert(locale.indexOf('_') !== -1);
	});
});

test('sync', function (t) {
	var locale = osLocale.sync();
	console.log('Locale identifier:', locale);
	t.assert(locale.length > 1);
	t.assert(locale.indexOf('_') !== -1);
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

	// reload os-locale so mock takes effect
	reloadOsLocale();

	// callback to restore env vars, undo mock, and reload os-locale for subsequent tests
	var afterTest = function () {
		restoreEnvVars(beforeTest);
		require('child_process').execFile = beforeTest.childProcessExecFile;
		reloadOsLocale();
	};

	// test async method
	osLocale(function (err, locale) {
		console.log('Locale identifier:', locale);
		afterTest();
		t.assert(!err, err);
		t.assert(locale === expectedFallback, 'Locale did not match expected fallback');
		t.assert(locale !== 'spawn_NOTALLOWED', 'Attempted to spawn subprocess');
	}, {spawn: false});
});

test.serial('sync without spawn', function (t) {
	var beforeTest = {};

	// unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// mock exec-file-sync
	beforeTest['exec-file-sync'] = require('exec-file-sync');
	require.cache[require.resolve('exec-file-sync')].exports = function () {
		t.assert(false, 'Attempted to spawn subprocess');
	};

	// reload os-locale so mock takes effect
	reloadOsLocale();

	// test sync method
	var locale = osLocale.sync({spawn: false});
	console.log('Locale identifier:', locale);
	t.assert(locale === expectedFallback, 'Locale did not match expected fallback');

	// restore env vars and undo mock
	restoreEnvVars(beforeTest);
	require.cache[require.resolve('exec-file-sync')].exports = beforeTest['exec-file-sync'];

	// reload os-locale for subsequent tests
	reloadOsLocale();

	t.end();
});
