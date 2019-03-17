export interface Options {
	/**
	Set to `false` to avoid spawning subprocesses and instead only resolve the locale from environment variables.

	@default true
	*/
	readonly spawn?: boolean;
}

declare const osLocale: {
	/**
	Get the system [locale](https://en.wikipedia.org/wiki/Locale_(computer_software)).

	@returns The locale.
	*/
	(options?: Options): Promise<string>;

	/**
	Synchronously get the system [locale](https://en.wikipedia.org/wiki/Locale_(computer_software)).

	@returns The locale.
	*/
	sync(options?: Options): string;
};

export default osLocale;
