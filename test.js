import childProcess from 'child_process';
import test from 'ava';
import requireUncached from 'require-uncached';

const envVars = ['LC_ALL', 'LANGUAGE', 'LANG', 'LC_MESSAGES'];
const expectedFallback = 'en_US';

function unsetEnvVars(cache) {
	envVars.forEach(envVar => {
		if (process.env[envVar]) {
			cache[envVar] = process.env[envVar];
			delete process.env[envVar];
		}
	});
}

function restoreEnvVars(cache) {
	envVars.forEach(envVar => {
		if (cache[envVar]) {
			process.env[envVar] = cache[envVar];
		}
	});
}

test.cb('async', t => {
	t.plan(3);

	requireUncached('./')((err, locale) => {
		console.log('Locale identifier:', locale);
		t.ifError(err);
		t.true(locale.length > 1);
		t.not(locale.indexOf('_'), -1);
		t.end();
	});
});

test('sync', t => {
	const locale = requireUncached('./').sync();
	console.log('Locale identifier:', locale);
	t.true(locale.length > 1);
	t.not(locale.indexOf('_'), -1);
});

test.cb.serial('async without spawn', t => {
	t.plan(3);

	const beforeTest = {};

	// unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// mock child_process.execFile
	beforeTest.childProcessExecFile = childProcess.execFile;
	childProcess.execFile = () => {
		const args = Array.prototype.slice.call(arguments);
		const execFileCb = args[args.length - 1];

		if (typeof execFileCb === 'function') {
			// passing Error here causes osLocale callback not to be called
			execFileCb(null, 'spawn_NOTALLOWED');
		}
	};

	// callback to restore env vars and undo mock
	const afterTest = () => {
		restoreEnvVars(beforeTest);
		childProcess.execFile = beforeTest.childProcessExecFile;
	};

	// test async method
	requireUncached('./')({spawn: false}, (err, locale) => {
		console.log('Locale identifier:', locale);
		afterTest();
		t.ifError(err);
		t.is(locale, expectedFallback, 'Locale did not match expected fallback');
		t.not(locale, 'spawn_NOTALLOWED', 'Attempted to spawn subprocess');
		t.end();
	});
});

test.serial('sync without spawn', t => {
	const beforeTest = {};

	// unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// mock child_process.execFileSync
	if (childProcess.execFileSync) {
		beforeTest.childProcessExecFileSync = childProcess.execFileSync;
		childProcess.execFileSync = () => {
			t.false('Attempted to spawn subprocess');
		};
	}

	// test sync method
	const locale = requireUncached('./').sync({spawn: false});
	console.log('Locale identifier:', locale);
	t.is(locale, expectedFallback, 'Locale did not match expected fallback');

	// restore env vars and undo mock
	restoreEnvVars(beforeTest);
	if (beforeTest.childProcessExecFileSync) {
		childProcess.execFileSync = beforeTest.childProcessExecFileSync;
	}
});
