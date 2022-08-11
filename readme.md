![graphql-api-koa logo](https://cdn.jsdelivr.net/gh/jaydenseric/graphql-api-koa@1.1.1/graphql-api-koa-logo.svg)

# graphql-api-koa

[GraphQL](https://graphql.org) execution and error handling middleware written from scratch for [Koa](https://koajs.com).

## Installation

To install [`graphql-api-koa`](https://npm.im/graphql-api-koa) and its [`graphql`](https://npm.im/graphql) peer dependency with [npm](https://npmjs.com/get-npm), run:

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

Supported runtime environments:

- [Node.js](https://nodejs.org) versions `^14.17.0 || ^16.0.0 || >= 18.0.0`.

Projects must configure [TypeScript](https://typescriptlang.org) to use types from the ECMAScript modules that have a `// @ts-check` comment:

- [`compilerOptions.allowJs`](https://typescriptlang.org/tsconfig#allowJs) should be `true`.
- [`compilerOptions.maxNodeModuleJsDepth`](https://typescriptlang.org/tsconfig#maxNodeModuleJsDepth) should be reasonably large, e.g. `10`.
- [`compilerOptions.module`](https://typescriptlang.org/tsconfig#module) should be `"node16"` or `"nodenext"`.

## Exports

The [npm](https://npmjs.com) package [`graphql-api-koa`](https://npm.im/graphql-api-koa) features [optimal JavaScript module design](https://jaydenseric.com/blog/optimal-javascript-module-design). It doesn’t have a main index module, so use deep imports from the ECMAScript modules that are exported via the [`package.json`](./package.json) field [`exports`](https://nodejs.org/api/packages.html#exports):

- [`errorHandler.mjs`](./errorHandler.mjs)
- [`execute.mjs`](./execute.mjs)
- [`GraphQLAggregateError.mjs`](./GraphQLAggregateError.mjs)
