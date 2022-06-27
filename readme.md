![graphql-api-koa logo](https://cdn.jsdelivr.net/gh/jaydenseric/graphql-api-koa@1.1.1/graphql-api-koa-logo.svg)

# graphql-api-koa

[![npm version](https://badgen.net/npm/v/graphql-api-koa)](https://npm.im/graphql-api-koa) [![CI status](https://github.com/jaydenseric/graphql-api-koa/workflows/CI/badge.svg)](https://github.com/jaydenseric/graphql-api-koa/actions)

[GraphQL](https://graphql.org) execution and error handling middleware written from scratch for [Koa](https://koajs.com).

## Installation

To install [`graphql-api-koa`](https://npm.im/graphql-api-koa) and the [`graphql`](https://npm.im/graphql) peer dependency with [npm](https://npmjs.com/get-npm), run:

```sh
npm install graphql-api-koa graphql
```

See the [`execute`](./execute.mjs) middleware examples to get started.

## Exports

These ECMAScript modules are published to [npm](https://npmjs.com) and exported via the [`package.json`](./package.json) `exports` field:

- [`errorHandler.mjs`](./errorHandler.mjs)
- [`execute.mjs`](./execute.mjs)
