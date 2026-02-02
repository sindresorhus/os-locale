import {expectType} from 'tsd';
import osLocale from './index.js';

expectType<string>(osLocale());
