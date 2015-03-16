# os-locale [![Build Status](https://travis-ci.org/sindresorhus/os-locale.svg?branch=master)](https://travis-ci.org/sindresorhus/os-locale)

> Get the system [locale](http://en.wikipedia.org/wiki/Locale)

Useful for localizing your module or app.


## Install

```
$ npm install --save os-locale
```


## Usage

```js
var osLocale = require('os-locale');

osLocale(function (err, locale) {
	console.log(locale);
	//=> 'en_US'
});
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
