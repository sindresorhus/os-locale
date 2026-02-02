# os-locale

> Get the system [locale](https://en.wikipedia.org/wiki/Locale_(computer_software))

> [!NOTE]
> You may want [`new Intl.DateTimeFormat().resolvedOptions().locale`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/resolvedOptions) instead. This package is useful for CLI tools as it also reads locale from environment variables (`LC_ALL`, `LC_MESSAGES`, `LANG`, `LANGUAGE`), which the Intl API does not fully support (it only respects `LC_ALL`).

Useful for localizing your module or app.

POSIX systems: The returned locale refers to the [`LC_MESSAGES`](http://www.gnu.org/software/libc/manual/html_node/Locale-Categories.html#Locale-Categories) category, suitable for selecting the language used in the user interface for message translation.

## Install

```sh
npm install os-locale
```

## Usage

```js
import osLocale from 'os-locale';

console.log(osLocale());
//=> 'en-US'
```

## API

### osLocale()

Returns the locale.
