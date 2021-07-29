import test from 'ava';
import proxyquireBase from 'proxyquire';

const proxyquire = proxyquireBase.noPreserveCache().noCallThru();

const expectedFallback = 'en-US';

const execaImport = './execa.js';

const noExeca = t => {
	const fn = () => t.fail('Execa should not be called');
	fn.stdout = async () => t.fail('Execa should not be called');

	return fn;
};

const syncExeca = callback => ({
	sync: (...args) => ({stdout: callback(...args)})
});

const asyncExeca = callback => async (...args) => ({stdout: callback(...args)});

const setPlatform = platform => {
	Object.defineProperty(process, 'platform', {value: platform});
};

const cache = {};

test.beforeEach(() => {
	cache.env = process.env;
	cache.platform = process.platform;

	process.env = {};
	setPlatform('linux');
});

test.afterEach.always(() => {
	process.env = cache.env;
	setPlatform(cache.platform);
});

/**
 * We're running tests in serial because we're mutating global state and we need to keep
 * the tests separated.
 */

test.serial('Async retrieve locale from LC_ALL env as 1st priority', async t => {
	process.env.LANGUAGE = 'en-GB1';
	process.env.LANG = 'en-GB2';
	process.env.LC_MESSAGES = 'en-GB3';
	process.env.LC_ALL = 'en-GB4';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)})();

	t.is(locale, 'en-GB4');
});

test.serial('Async retrieve locale from LC_MESSAGES env as 2st priority', async t => {
	process.env.LANGUAGE = 'en-GB1';
	process.env.LANG = 'en-GB2';
	process.env.LC_MESSAGES = 'en-GB3';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)})();

	t.is(locale, 'en-GB3');
});

test.serial('Async retrieve locale from LANG env as 3st priority', async t => {
	process.env.LANGUAGE = 'en-GB1';
	process.env.LANG = 'en-GB2';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)})();

	t.is(locale, 'en-GB2');
});

test.serial('Async retrieve locale from LANGUAGE env as 4st priority', async t => {
	process.env.LANGUAGE = 'en-GB1';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)})();

	t.is(locale, 'en-GB1');
});

test.serial('Sync retrieve locale from LC_ALL env as 1st priority', async t => {
	process.env.LANGUAGE = 'en-GB1';
	process.env.LANG = 'en-GB2';
	process.env.LC_MESSAGES = 'en-GB3';
	process.env.LC_ALL = 'en-GB4';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)}).sync();

	t.is(locale, 'en-GB4');
});

test.serial('Sync retrieve locale from LC_MESSAGES env as 2st priority', async t => {
	process.env.LANGUAGE = 'en-GB1';
	process.env.LANG = 'en-GB2';
	process.env.LC_MESSAGES = 'en-GB3';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)}).sync();

	t.is(locale, 'en-GB3');
});

test.serial('Sync retrieve locale from LANG env as 3st priority', async t => {
	process.env.LANGUAGE = 'en-GB1';
	process.env.LANG = 'en-GB2';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)}).sync();

	t.is(locale, 'en-GB2');
});

test.serial('Sync retrieve locale from LANGUAGE env as 4st priority', async t => {
	process.env.LANGUAGE = 'en-GB1';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)}).sync();

	t.is(locale, 'en-GB1');
});

test.serial('Async normalises locale', async t => {
	process.env.LC_ALL = 'en_GB';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)})();

	t.is(locale, 'en-GB');
});

test.serial('Sync normalises locale', async t => {
	process.env.LC_ALL = 'en_GB';

	const locale = await proxyquire('.', {[execaImport]: noExeca(t)}).sync();

	t.is(locale, 'en-GB');
});

test.serial('Async fallback locale when env variables missing and spawn=false ', async t => {
	const locale = await proxyquire('.', {[execaImport]: noExeca(t)})({spawn: false});

	t.is(locale, expectedFallback, 'Locale did not match expected fallback');
});

test.serial('Sync fallback locale when env variables missing and spawn=false ', async t => {
	const locale = await proxyquire('.', {[execaImport]: noExeca(t)}).sync({spawn: false});

	t.is(locale, expectedFallback, 'Locale did not match expected fallback');
});

test.serial('Async handle darwin locale ', async t => {
	setPlatform('darwin');
	const execa = asyncExeca(cmd => cmd === 'defaults' ? 'en-GB' : ['en-US', 'en-GB']);

	const locale = await proxyquire('.', {[execaImport]: execa})();

	t.is(locale, 'en-GB');
});

test.serial('Sync handle darwin locale ', async t => {
	setPlatform('darwin');
	const execa = syncExeca(cmd => cmd === 'defaults' ? 'en-GB' : ['en-US', 'en-GB']);

	const locale = await proxyquire('.', {[execaImport]: execa}).sync();

	t.is(locale, 'en-GB');
});

test.serial('Async handle win32 locale ', async t => {
	setPlatform('win32');
	const execa = asyncExeca(() => 'Locale\n0809\n');

	const locale = await proxyquire('.', {[execaImport]: execa})();

	t.is(locale, 'en-GB');
});

test.serial('Sync handle win32 locale ', async t => {
	setPlatform('win32');
	const execa = syncExeca(() => 'Locale\n0809\n');

	const locale = await proxyquire('.', {[execaImport]: execa}).sync();

	t.is(locale, 'en-GB');
});

test.serial('Async handle linux locale ', async t => {
	setPlatform('linux');
	const execa = asyncExeca(() => `LANG="en-GB"
LC_COLLATE="en_GB"
LC_CTYPE="UTF-8"
LC_MESSAGES="en_GB"
LC_MONETARY="en_GB"
LC_NUMERIC="en_GB"
LC_TIME="en_GB"
LC_ALL=en_GB`);

	const locale = await proxyquire('.', {[execaImport]: execa})();

	t.is(locale, 'en-GB');
});

test.serial('Sync handle linux locale ', async t => {
	setPlatform('linux');
	const execa = syncExeca(() => `LANG="en-GB"
LC_COLLATE="en_GB"
LC_CTYPE="UTF-8"
LC_MESSAGES="en_GB"
LC_MONETARY="en_GB"
LC_NUMERIC="en_GB"
LC_TIME="en_GB"
LC_ALL=en_GB`);

	const locale = await proxyquire('.', {[execaImport]: execa}).sync();

	t.is(locale, 'en-GB');
});
