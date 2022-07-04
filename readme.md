![graphql-api-koa logo](https://cdn.jsdelivr.net/gh/jaydenseric/graphql-api-koa@1.1.1/graphql-api-koa-logo.svg)

# graphql-api-koa

[![npm version](https://badgen.net/npm/v/graphql-api-koa)](https://npm.im/graphql-api-koa) [![CI status](https://github.com/jaydenseric/graphql-api-koa/workflows/CI/badge.svg)](https://github.com/jaydenseric/graphql-api-koa/actions)

[GraphQL](https://graphql.org) execution and error handling middleware written from scratch for [Koa](https://koajs.com).

## Installation

To install [`graphql-api-koa`](https://npm.im/graphql-api-koa) and the [`graphql`](https://npm.im/graphql) peer dependency with [npm](https://npmjs.com/get-npm), run:

```sh
npm install graphql-api-koa graphql
```

Setup the Koa middleware in this order:

1. [`errorHandler`](./errorHandler.mjs), to catch errors from following middleware for a correctly formatted [GraphQL response](https://spec.graphql.org/October2021/#sec-Errors).
2. A [GraphQL multipart request](https://github.com/jaydenseric/graphql-multipart-request-spec) processor like `graphqlUploadKoa` from [`graphql-upload`](https://npm.im/graphql-upload), to support file uploads (optional).
3. A request body parser like [`koa-bodyparser`](https://npm.im/koa-bodyparser).
4. [`execute`](./execute.mjs), to execute GraphQL.

See the [`execute`](./execute.mjs) middleware examples to get started.

## Requirements

- [Node.js](https://nodejs.org): `^14.17.0 || ^16.0.0 || >= 18.0.0`

## Exports

These ECMAScript modules are published to [npm](https://npmjs.com) and exported via the [`package.json`](./package.json) `exports` field:

- [`errorHandler.mjs`](./errorHandler.mjs)
- [`execute.mjs`](./execute.mjs)
- [`GraphQLAggregateError.mjs`](./GraphQLAggregateError.mjs)
