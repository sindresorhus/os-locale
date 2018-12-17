import path from 'path';
import execa from 'execa';
import test from 'ava';
import importFresh from 'import-fresh';

const envVars = ['LC_ALL', 'LANGUAGE', 'LANG', 'LC_MESSAGES'];
const expectedFallback = 'en_US';

const mainPath = path.resolve(__dirname, 'index.js');

function unsetEnvVars(cache) {
	for (const envVar of envVars) {
		if (process.env[envVar]) {
			cache[envVar] = process.env[envVar];
			delete process.env[envVar];
		}
	}
}

function restoreEnvVars(cache) {
	for (const envVar of envVars) {
		if (cache[envVar]) {
			process.env[envVar] = cache[envVar];
		}
	}
}

test('async', async t => {
	const locale = await importFresh(mainPath)();
	console.log('Locale identifier:', locale);
	t.true(locale.length > 1);
	t.true(locale.includes('_'));
});

test('sync', t => {
	const locale = importFresh(mainPath).sync();
	console.log('Locale identifier:', locale);
	t.true(locale.length > 1);
	t.true(locale.includes('_'));
});

test('async without spawn', async t => {
	const beforeTest = {};

	// Unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// Mock execa.stdout
	beforeTest.stdout = execa.stdout;
	execa.stdout = () => new Promise(resolve => resolve('spawn_NOTALLOWED'));

	// Callback to restore env vars and undo mock
	const afterTest = () => {
		restoreEnvVars(beforeTest);
		execa.stdout = beforeTest.execaStdout;
	};

	// Test async method
	const locale = await importFresh(mainPath)({spawn: false});
	console.log('Locale identifier:', locale);
	afterTest();
	t.is(locale, expectedFallback, 'Locale did not match expected fallback');
	t.not(locale, 'spawn_NOTALLOWED', 'Attempted to spawn subprocess');
});

test('sync without spawn', t => {
	const beforeTest = {};

	// Unset env vars and cache for restoration
	unsetEnvVars(beforeTest);

	// Mock execa.sync
	beforeTest.execaSync = execa.sync;
	execa.sync = () => {
		t.false('Attempted to spawn subprocess');
	};

	// Test sync method
	const locale = importFresh(mainPath).sync({spawn: false});
	console.log('Locale identifier:', locale);
	t.is(locale, expectedFallback, 'Locale did not match expected fallback');

	// Restore env vars and undo mock
	restoreEnvVars(beforeTest);
	if (beforeTest.execaSync) {
		execa.sync = beforeTest.execaSync;
	}
});
