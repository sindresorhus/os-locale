'use strict';
const execa = require('execa');
const lcid = require('lcid');
const mem = require('mem');

const defaultOptions = {spawn: true};
const defaultLocale = 'en-US';

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
	return execa.stdout('locale', ['-a']);
}

function getLocalesSync() {
	return execa.sync('locale', ['-a']).stdout;
}

function getSupportedLocale(locale, locales = '') {
	return locales.includes(locale) ? locale : defaultLocale;
}

async function getAppleLocale() {
	const results = await Promise.all([
		execa.stdout('defaults', ['read', '-globalDomain', 'AppleLocale']),
		getLocales()
	]);

	return getSupportedLocale(results[0], results[1]);
}

function getAppleLocaleSync() {
	return getSupportedLocale(
		execa.sync('defaults', ['read', '-globalDomain', 'AppleLocale']).stdout,
		getLocalesSync()
	);
}

async function getUnixLocale() {
	if (process.platform === 'darwin') {
		return getAppleLocale();
	}

	return getLocale(parseLocale(await execa.stdout('locale')));
}

function getUnixLocaleSync() {
	if (process.platform === 'darwin') {
		return getAppleLocaleSync();
	}

	return getLocale(parseLocale(execa.sync('locale').stdout));
}

async function getWinLocale() {
	const stdout = await execa.stdout('wmic', ['os', 'get', 'locale']);
	const lcidCode = parseInt(stdout.replace('Locale', ''), 16);
	return lcid.from(lcidCode);
}

function getWinLocaleSync() {
	const {stdout} = execa.sync('wmic', ['os', 'get', 'locale']);
	const lcidCode = parseInt(stdout.replace('Locale', ''), 16);
	return lcid.from(lcidCode);
}

const osLocale = mem(async (options = defaultOptions) => {
	let locale;
	try {
		const envLocale = getEnvLocale();

		if (envLocale || options.spawn === false) {
			locale = getLocale(envLocale);
		} else if (process.platform === 'win32') {
			locale = await getWinLocale();
		} else {
			locale = await getUnixLocale();
		}
	} catch (_) {}

	return (locale || defaultLocale).replace(/_/, '-');
}, {cachePromiseRejection: false});

module.exports = osLocale;

module.exports.sync = mem((options = defaultOptions) => {
	let locale;
	try {
		const envLocale = getEnvLocale();

		if (envLocale || options.spawn === false) {
			locale = getLocale(envLocale);
		} else if (process.platform === 'win32') {
			locale = getWinLocaleSync();
		} else {
			locale = getUnixLocaleSync();
		}
	} catch (_) {}

	return (locale || defaultLocale).replace(/_/, '-');
});
