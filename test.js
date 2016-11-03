import execa from 'execa';
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
	t.plan(2);

	requireUncached('./')()
		.then(locale => {
			console.log('Locale identifier:', locale);
			t.true(locale.length > 1);
			t.not(locale.indexOf('_'), -1);
			t.end();
		})
		.catch(() => {
			t.false('Promise rejected');
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
	t.plan(2);

	const beforeTest = {};

	// unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// mock execa.stdout
	beforeTest.stdout = execa.stdout;
	execa.stdout = () => new Promise(resolve => resolve('spawn_NOTALLOWED'));

	// callback to restore env vars and undo mock
	const afterTest = () => {
		restoreEnvVars(beforeTest);
		execa.stdout = beforeTest.execaStdout;
	};

	// test async method
	requireUncached('./')({spawn: false})
		.then(locale => {
			console.log('Locale identifier:', locale);
			afterTest();
			t.is(locale, expectedFallback, 'Locale did not match expected fallback');
			t.not(locale, 'spawn_NOTALLOWED', 'Attempted to spawn subprocess');
			t.end();
		})
		.catch(() => {
			t.false('Promise rejected');
			t.end();
		});
});

test.serial('sync without spawn', t => {
	const beforeTest = {};

	// unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// mock execa.sync
	if (execa.sync) {
		beforeTest.execaSync = execa.sync;
		execa.sync = () => {
			t.false('Attempted to spawn subprocess');
		};
	}

	// test sync method
	const locale = requireUncached('./').sync({spawn: false});
	console.log('Locale identifier:', locale);
	t.is(locale, expectedFallback, 'Locale did not match expected fallback');

	// restore env vars and undo mock
	restoreEnvVars(beforeTest);
	if (beforeTest.execaSync) {
		execa.sync = beforeTest.execaSync;
	}
});
