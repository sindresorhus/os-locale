/**
Get the system [locale](https://en.wikipedia.org/wiki/Locale_(computer_software)).

@returns The locale.

@example
```
import osLocale from 'os-locale';

console.log(osLocale());
//=> 'en-US'
```
*/
export default function osLocale(): string;
