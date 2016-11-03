'use strict';
const execa = require('execa');
const lcid = require('lcid');
const mem = require('mem');

const defaultOpts = {spawn: true};

function fallback() {
	return 'en_US';
}

function getEnvLocale(env) {
	env = env || process.env;
	return env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE;
}

function parseLocale(x) {
	const env = x.split('\n').reduce((env, def) => {
		def = def.split('=');
		env[def[0]] = def[1];
		return env;
	}, {});
	return getEnvLocale(env);
}

function getLocale(str) {
	return (str && str.replace(/["]?(.*)[.:].*/, '$1')) || fallback();
}

module.exports = mem(opts => {
	opts = opts || defaultOpts;

	const envLocale = getEnvLocale();
	let locale;

	if (envLocale || opts.spawn === false) {
		locale = getLocale(envLocale);
		return Promise.resolve(locale);
	}

	const getAppleLocale = () => execa.stdout('defaults', ['read', '-g', 'AppleLocale'])
			.then(stdout => {
				locale = stdout.trim() || fallback();
				return locale;
			})
			.catch(() => fallback());

	if (process.platform === 'win32') {
		return execa.stdout('wmic', ['os', 'get', 'locale'])
			.then(stdout => {
				const lcidCode = parseInt(stdout.replace('Locale', ''), 16);
				locale = lcid.from(lcidCode) || fallback();
				return locale;
			})
			.catch(() => fallback());
	}

	return execa.stdout('locale')
		.then(stdout => {
			const res = parseLocale(stdout);
			if (!res && process.platform === 'darwin') {
				return getAppleLocale();
			}

			locale = getLocale(res);
			return locale;
		})
		.catch(() => fallback());
});

module.exports.sync = mem(opts => {
	opts = opts || defaultOpts;

	const envLocale = getEnvLocale();
	let locale;

	if (envLocale || !execa.sync || opts.spawn === false) {
		locale = getLocale(envLocale);
		return locale;
	}

	if (process.platform === 'win32') {
		let stdout;

		try {
			stdout = execa.sync('wmic', ['os', 'get', 'locale']);
		} catch (err) {
			return fallback();
		}

		const lcidCode = parseInt(stdout.replace('Locale', ''), 16);
		locale = lcid.from(lcidCode) || fallback();
		return locale;
	}

	let res;

	try {
		res = parseLocale(execa.sync('locale'));
	} catch (err) {}

	if (!res && process.platform === 'darwin') {
		try {
			locale = execa.sync('defaults', ['read', '-g', 'AppleLocale']).trim() || fallback();
		} catch (err) {
			locale = fallback();
		}
		return locale;
	}

	locale = getLocale(res);
	return locale;
});
