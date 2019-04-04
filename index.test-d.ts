import {expectType} from 'tsd';
import osLocale = require('.');

expectType<Promise<string>>(osLocale());
expectType<Promise<string>>(osLocale({spawn: false}));

expectType<string>(osLocale.sync());
expectType<string>(osLocale.sync({spawn: false}));
