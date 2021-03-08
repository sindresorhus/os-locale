'use strict';
const execa = require('execa');
const lcid = require('lcid');

const defaultOptions = {spawn: true};
const defaultLocale = 'en-US';

async function getStdOut(command, args) {
	return (await execa(command, args)).stdout;
}

function getStdOutSync(command, args) {
	return execa.sync(command, args).stdout;
}

function getEnvLocale(env = process.env) {
	return env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE;
}

function parseLocale(string) {
	const env = string.split('\n').reduce((env, definition) => {
		const [key, value] = definition.split('=');
		env[key] = value.replace(/^"|"$/g, '');
		return env;
	}, {});

	return getEnvLocale(env);
}

function getLocale(string) {
	return (string && string.replace(/[.:].*/, ''));
}

async function getLocales() {
	return getStdOut('locale', ['-a']);
}

function getLocalesSync() {
	return getStdOutSync('locale', ['-a']);
}

function getSupportedLocale(locale, locales = '') {
	return locales.includes(locale) ? locale : defaultLocale;
}

async function getAppleLocale() {
	const results = await Promise.all([
		getStdOut('defaults', ['read', '-globalDomain', 'AppleLocale']),
		getLocales()
	]);

	return getSupportedLocale(results[0], results[1]);
}

function getAppleLocaleSync() {
	return getSupportedLocale(
		getStdOutSync('defaults', ['read', '-globalDomain', 'AppleLocale']),
		getLocalesSync()
	);
}

async function getUnixLocale() {
	return getLocale(parseLocale(await getStdOut('locale')));
}

function getUnixLocaleSync() {
	return getLocale(parseLocale(getStdOutSync('locale')));
}

async function getWinLocale() {
	const stdout = await getStdOut('wmic', ['os', 'get', 'locale']);
	const lcidCode = Number.parseInt(stdout.replace('Locale', ''), 16);

	return lcid.from(lcidCode);
}

function getWinLocaleSync() {
	const stdout = getStdOutSync('wmic', ['os', 'get', 'locale']);
	const lcidCode = Number.parseInt(stdout.replace('Locale', ''), 16);

	return lcid.from(lcidCode);
}

function normalise(input) {
	return input.replace(/_/, '-');
}

// Uses simple map as a simple memoization technique without having to import `mem`
const asyncCache = new Map();

module.exports = async (options = defaultOptions) => {
	if (asyncCache.has(options.spawn)) {
		return asyncCache.get(options.spawn);
	}

	let locale;

	try {
		const envLocale = getEnvLocale();

		if (envLocale || options.spawn === false) {
			locale = getLocale(envLocale);
		} else if (process.platform === 'win32') {
			locale = await getWinLocale();
		} else if (process.platform === 'darwin') {
			locale = await getAppleLocale();
		} else {
			locale = await getUnixLocale();
		}
	} catch {}

	const normalised = normalise(locale || defaultLocale);
	asyncCache.set(options.spawn, normalised);
	return normalised;
};

const syncCache = new Map();

module.exports.sync = (options = defaultOptions) => {
	if (syncCache.has(options.spawn)) {
		return syncCache.get(options.spawn);
	}

	let locale;
	try {
		const envLocale = getEnvLocale();

		if (envLocale || options.spawn === false) {
			locale = getLocale(envLocale);
		} else if (process.platform === 'win32') {
			locale = getWinLocaleSync();
		} else if (process.platform === 'darwin') {
			locale = getAppleLocaleSync();
		} else {
			locale = getUnixLocaleSync();
		}
	} catch {}

	const normalised = normalise(locale || defaultLocale);
	syncCache.set(options.spawn, normalised);
	return normalised;
};
