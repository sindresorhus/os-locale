'use strict';
var test = require('ava');
var osLocale = require('./');

test('async', function (t) {
	t.plan(2);

	osLocale(function (err, locale) {
		console.log('Locale identifier:', locale);
		t.assert(locale.length > 1);
		t.assert(locale.indexOf('_') !== -1);
	});
});

test('sync', function (t) {
	var locale = osLocale.sync();
	console.log('Locale identifier:', locale);
	t.assert(locale.length > 1);
	t.assert(locale.indexOf('_') !== -1);
	t.end();
});
