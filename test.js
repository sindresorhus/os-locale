import process from 'node:process';
import test from 'ava';
import osLocale from './index.js';

const cache = {};

test.beforeEach(() => {
	cache.env = process.env;
	process.env = {};
});

test.afterEach.always(() => {
	process.env = cache.env;
});

/*
We're running tests in serial because we're mutating global state and we need to keep the tests separated.
*/

test.serial('retrieve locale from LC_ALL env as 1st priority', t => {
	process.env.LANGUAGE = 'en-GB1';
	process.env.LANG = 'en-GB2';
	process.env.LC_MESSAGES = 'en-GB3';
	process.env.LC_ALL = 'en-GB4';

	t.is(osLocale(), 'en-GB4');
});

test.serial('retrieve locale from LC_MESSAGES env as 2nd priority', t => {
	process.env.LANGUAGE = 'en-GB1';
	process.env.LANG = 'en-GB2';
	process.env.LC_MESSAGES = 'en-GB3';

	t.is(osLocale(), 'en-GB3');
});

test.serial('retrieve locale from LANG env as 3rd priority', t => {
	process.env.LANGUAGE = 'en-GB1';
	process.env.LANG = 'en-GB2';

	t.is(osLocale(), 'en-GB2');
});

test.serial('retrieve locale from LANGUAGE env as 4th priority', t => {
	process.env.LANGUAGE = 'en-GB1';

	t.is(osLocale(), 'en-GB1');
});

test.serial('normalises locale', t => {
	process.env.LC_ALL = 'en_GB';

	t.is(osLocale(), 'en-GB');
});

test.serial('strips encoding suffix', t => {
	process.env.LC_ALL = 'en_GB.UTF-8';

	t.is(osLocale(), 'en-GB');
});

test.serial('strips modifier suffix', t => {
	process.env.LC_ALL = 'de_DE@euro';

	t.is(osLocale(), 'de-DE');
});

test.serial('strips encoding and modifier suffix', t => {
	process.env.LC_ALL = 'de_DE.UTF-8@euro';

	t.is(osLocale(), 'de-DE');
});

test.serial('falls back to Intl when no env variables', t => {
	const expected = new Intl.DateTimeFormat().resolvedOptions().locale;

	t.is(osLocale(), expected);
});
