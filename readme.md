# os-locale [![Build Status](https://travis-ci.org/sindresorhus/os-locale.svg?branch=master)](https://travis-ci.org/sindresorhus/os-locale)

> Get the system [locale](http://en.wikipedia.org/wiki/Locale)

Useful for localizing your module or app.


## Install

```
$ npm install --save os-locale
```


## Usage

### Async

Provide a callback that will be executed when the operating system's
locale has been resolved.

```js
var osLocale = require('os-locale');

osLocale(function (err, locale) {
	console.log(locale);
	//=> 'en_US'
});
```

### Sync

Return the operating system's locale as soon as it is resolved.

```js
var osLocale = require('os-locale');

var locale = osLocale.sync();
console.log(locale);
//=> 'en_US'
```

### Options

For either method, optionally pass `{spawn: false}` as an additional
argument to avoid spawning subprocesses and resolve the locale from
environment variables alone.

## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
