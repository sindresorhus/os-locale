export default function osLocale(env = globalThis.process?.env ?? {}) { // eslint-disable-line n/prefer-global/process
	const locale = env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE;

	if (locale) {
		return locale.replace(/[.:].*/, '').replace(/@.*/, '').replace(/_/, '-');
	}

	return new Intl.DateTimeFormat().resolvedOptions().locale;
}
