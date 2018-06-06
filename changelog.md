# graphql-api-koa changelog

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
