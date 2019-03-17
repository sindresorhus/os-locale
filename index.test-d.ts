import {expectType} from 'tsd-check';
import osLocale from '.';

expectType<Promise<string>>(osLocale());
expectType<Promise<string>>(osLocale({spawn: false}));

expectType<string>(osLocale.sync());
expectType<string>(osLocale.sync({spawn: false}));
