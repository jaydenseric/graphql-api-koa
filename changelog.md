# graphql-api-koa changelog

## Next

### Patch

- Updated dev dependencies.

## 1.0.0

- Updated dependencies.
- Lint fixes following dependency updates.
- Use [`jsdoc-md`](https://npm.im/jsdoc-md) instead of [`documentation`](https://npm.im/documentation) to generate readme API docs.
- Removed a temporary workaround for [a fixed Babel CLI bug](https://github.com/babel/babel/issues/8077).
- Updated package description and tags.

## 0.3.1

- Updated dependencies.
- Simplified ESLint config with [eslint-config-env](https://npm.im/eslint-config-env).

## 0.3.0

- Corrected an `errorHandler` middleware example in the readme.
- Refactored package scripts to use `prepare` to support installation via Git (e.g. `npm install jaydenseric/graphql-api-koa`).
- Compact package `repository` field.

## 0.2.0

- Set Node.js support as v8.5+.
- Avoided using a Koa context response shortcut.
- Fixed test snapshot consistency between Node.js versions (see [tapjs/node-tap#450](https://github.com/tapjs/node-tap/issues/450)).
- Manually test error properties instead of using snapshots.
- Added `errorHandler` middleware tests.
- Readme badge changes to deal with [shields.io](https://shields.io) unreliability:
  - Used the more reliable build status badge provided by Travis and placed it first as it loads the quickest.
  - Removed the licence badge. The licence can be found in `package.json` and rarely changes.
  - Removed the Github issues and stars badges. The readme is most viewed on Github anyway.
- Improved documentation.

## 0.1.0

- Initial release.
