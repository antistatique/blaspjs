# blaspjs

TypeScript / JavaScript library that ports the **language-agnostic core** of [Blaspsoft Blasp v4](https://github.com/Blaspsoft/blasp): driver-based profanity detection, severity scoring, masking, and multi-language dictionaries (English, Spanish, German, French). It is intended for Node.js and bundlers (ESM); the build targets modern browsers as well.

Blasp itself is a Laravel package; this project does **not** ship Laravel integration. Use it in Express, Nest, Remix, serverless handlers, or any TS/JS runtime.

## Installation

```bash
npm install blaspjs
# or
bun add blaspjs
```

Peer dependency: TypeScript `^5.0` (optional if you consume only JavaScript).

## Quick start

```ts
import { Blasp, Severity } from 'blaspjs';

const blasp = new Blasp();

const result = blasp.check('This is a fucking sentence');

result.isOffensive(); // true
result.clean(); // masked text (e.g. asterisks)
result.original(); // unchanged input
result.score(); // 0–100
result.count(); // number of matches
result.uniqueWords(); // unique dictionary bases
result.severity(); // highest SeverityLevel in matches, or null
```

A default instance is also exported as `blasp` (same defaults as `new Blasp()`).

## Fluent API

`Blasp` mirrors the PHP `PendingCheck` surface: chain options, then call `check(text)` or `checkMany(...)`.

### Languages

```ts
blasp.in('spanish').check(text);
blasp.in('english', 'french').check(text);
blasp.inAllLanguages().check(text);

blasp.english().check(text);
blasp.spanish().check(text);
blasp.german().check(text);
blasp.french().check(text);
```

### Drivers

```ts
blasp.driver('regex').check(text); // default; obfuscation, substitutions, separators
blasp.driver('pattern').check(text); // fast word-boundary exact match
blasp.driver('phonetic').check(text); // metaphone + Levenshtein (English-oriented)
blasp.driver('pipeline').check(text); // uses config `drivers.pipeline.drivers`

blasp.pipeline('regex', 'phonetic').check(text);
```

### Modes

```ts
blasp.lenient().check(text); // forces the `pattern` driver (same as PHP)
blasp.strict().check(text); // clears lenient mode; included in the result cache key like PHP
```

### Masking

```ts
blasp.mask('*').check(text);
blasp.mask('#').check(text);
blasp.mask('grawlix').check(text); // !@#$% rotation
blasp.mask((word, len) => '[CENSORED]').check(text);
```

Callback masks **disable** result caching (same idea as PHP: closures are not serializable).

### Severity and lists

```ts
import { Severity } from 'blaspjs';

blasp.withSeverity(Severity.High).check(text); // drops milder matches before masking

blasp.allow('damn', 'hell').check(text);
blasp.block('customword').check(text);
```

### Batch

```ts
blasp.checkMany(['one', 'two']); // Result[]
blasp.checkMany({ a: 'x', b: 'y' }); // Record<string, Result>
```

### Custom drivers

```ts
import type { Driver } from 'blaspjs';

const myDriver: Driver = {
  detect(text, dictionary, mask, options) {
    /* return a Result */
  },
};

blasp.extend('my-driver', () => myDriver);
blasp.driver('my-driver').check(text);
```

## `Result`

| Method           | Returns              | Description                          |
| ---------------- | -------------------- | ------------------------------------ |
| `isOffensive()`  | `boolean`            | Any profanity matched                |
| `isClean()`      | `boolean`            | No matches                           |
| `clean()`        | `string`             | Masked text                          |
| `original()`     | `string`             | Original input                       |
| `score()`        | `number`             | 0–100 severity score                 |
| `count()`        | `number`             | Match count                          |
| `uniqueWords()`  | `string[]`           | Unique base words                    |
| `severity()`     | `SeverityLevel \| null` | Strongest severity among matches  |
| `words()`        | `MatchedWord[]`      | Positions, lengths, severity, etc.   |
| `toArray()`      | `object`             | JSON-friendly snapshot               |
| `toJson()`       | `string`             | `JSON.stringify(toArray())`          |

Legacy-style aliases from PHP v3 are available on `Result` (`hasProfanity`, `getCleanString`, …).

`String(result)` / template interpolation uses the clean string (like PHP `Stringable`).

## Configuration

Pass a partial config to `new Blasp(partialConfig)`; it is deep-merged with `defaultBlaspConfig` (see [`src/config/defaultConfig.ts`](src/config/defaultConfig.ts) and [`src/config/blasp-defaults.json`](src/config/blasp-defaults.json)).

Relevant keys include:

- `default` — default driver name (`regex`, `pattern`, `phonetic`, `pipeline`)
- `language` / `default_language`
- `mask` / `mask_character`
- `allow`, `block`, `false_positives`, `separators`, `substitutions`
- `drivers.pipeline.drivers`, `drivers.phonetic.*`
- `cache.enabled`, `cache.results`, `cache.ttl`

Middleware / Eloquent / Blade keys exist on the type for parity with PHP config shape; they are **not** used by this library.

## Runtime options

```ts
import { Blasp, MemoryCache } from 'blaspjs';

const blasp = new Blasp(undefined, {
  cache: new MemoryCache(), // or your own CacheAdapter; pass null to disable internal cache
  onProfanityDetected(result, originalText) {
    if (result.isOffensive()) {
      // logging, metrics, etc.
    }
  },
});
```

`getCache()` returns `null` when `cache.enabled` is false or `runtime.cache === null`.

## Regenerating language data

Word lists and global separator/substitution defaults are vendored as JSON. To refresh from upstream [Blaspsoft/blasp](https://github.com/Blaspsoft/blasp):

```bash
bun run export-languages
```

Requires `curl` and `php` on your PATH. This overwrites `src/languages/*.json` and `src/config/blasp-defaults.json`.

## API parity vs PHP Blasp

| Feature | PHP ([Blasp v4](https://github.com/Blaspsoft/blasp)) | blaspjs |
| ------- | ---------------------------------------------------- | ------- |
| Drivers: regex, pattern, phonetic, pipeline | Yes | Yes |
| Fluent `PendingCheck` API | Yes | Yes |
| `Result` / `MatchedWord`, scoring, masking | Yes | Yes |
| Multi-language dictionaries + normalizers | Yes | Yes |
| Allow / block lists, severity filter | Yes | Yes |
| Result caching (in-memory or custom) | Laravel cache | `MemoryCache` or `CacheAdapter` |
| Custom drivers (`extend`) | Yes | Yes |
| Laravel facade, service provider | Yes | No |
| Middleware, validation rules, Blade | Yes | No |
| Eloquent `Blaspable`, model events | Yes | No |
| Artisan commands, `Blasp::fake()` | Yes | No |

For full behaviour and examples, see the [upstream README](https://github.com/Blaspsoft/blasp/blob/main/README.md).

## Development

```bash
bun install
bun run build   # ESM + types in dist/
bun test        # Vitest
bun run lint:js
```

## License

MIT. Profanity dictionaries and algorithmic behaviour are derived from [Blaspsoft/blasp](https://github.com/Blaspsoft/blasp) (MIT). This port is maintained separately and is not an official Blaspsoft package unless they choose to adopt it.
