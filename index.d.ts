declare namespace osLocale {
	interface Options {
		/**
		Set to `false` to avoid spawning subprocesses and instead only resolve the locale from environment variables.

		@default true
		*/
		readonly spawn?: boolean;
	}
}

declare const osLocale: {
	/**
	Get the system [locale](https://en.wikipedia.org/wiki/Locale_(computer_software)).

	@returns The locale.

	@example
	```
	import osLocale = require('os-locale');

	(async () => {
		console.log(await osLocale());
		//=> 'en_US'
	})();
	```
	*/
	(options?: osLocale.Options): Promise<string>;

	/**
	Synchronously get the system [locale](https://en.wikipedia.org/wiki/Locale_(computer_software)).

	@returns The locale.
	*/
	sync(options?: osLocale.Options): string;
};

export = osLocale;
