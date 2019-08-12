![graphql-api-koa logo](https://cdn.rawgit.com/jaydenseric/graphql-api-koa/d65828b/graphql-api-koa-logo.svg)

# graphql-api-koa

[![npm version](https://badgen.net/npm/v/graphql-api-koa)](https://npm.im/graphql-api-koa) [![Build status](https://travis-ci.org/jaydenseric/graphql-api-koa.svg?branch=master)](https://travis-ci.org/jaydenseric/graphql-api-koa)

GraphQL API Koa middleware; the first Node.js GraphQL server to support [native ESM](https://nodejs.org/api/esm.html) via `.mjs`.

## Setup

To install [`graphql-api-koa`](https://npm.im/graphql-api-koa) and [`graphql`](https://npm.im/graphql) from [npm](https://npmjs.com) run:

```sh
npm install graphql-api-koa graphql
```

See the [execute middleware](#function-execute) examples to get started.

## API

### Table of contents

- [function errorHandler](#function-errorhandler)
- [function execute](#function-execute)
- [type ExecuteOptions](#type-executeoptions)
- [type ExecuteOptionsOverride](#type-executeoptionsoverride)

### function errorHandler

Creates Koa middleware to handle errors. Use this before other middleware to catch all errors for a [correctly formated GraphQL response](http://facebook.github.io/graphql/October2016/#sec-Errors). When intentionally throwing an error, create it with `status` and `expose` properties using [http-errors](https://npm.im/http-errors) or the response will be a generic 500 error for security.

**Returns:** Function — Koa middleware.

#### Examples

_How to throw an error determining the response._

> ```js
> import Koa from 'koa'
> import bodyParser from 'koa-bodyparser'
> import { errorHandler, execute } from 'graphql-api-koa'
> import createError from 'http-errors'
> import schema from './schema'
>
> const app = new Koa()
>   .use(errorHandler())
>   .use(async (ctx, next) => {
>     if (
>       // It’s Saturday.
>       new Date().getDay() === 6
>     )
>       throw createError(503, 'No work on the sabbath.', { expose: true })
>
>     await next()
>   })
>   .use(bodyParser())
>   .use(execute({ schema }))
> ```

---

### function execute

Creates Koa middleware to execute GraphQL. Use after the [`errorHandler`](#function-errorhandler) and [body parser](https://npm.im/koa-bodyparser) middleware.

| Parameter | Type                                   | Description |
| :-------- | :------------------------------------- | :---------- |
| `options` | [ExecuteOptions](#type-executeoptions) | Options.    |

**Returns:** Function — Koa middleware.

#### Examples

_A basic GraphQL API._

> ```js
> import Koa from 'koa'
> import bodyParser from 'koa-bodyparser'
> import { errorHandler, execute } from 'graphql-api-koa'
> import schema from './schema'
>
> const app = new Koa()
>   .use(errorHandler())
>   .use(bodyParser())
>   .use(execute({ schema }))
> ```

---

### type ExecuteOptions

[`execute`](#function-execute) Koa middleware options.

**Type:** object

| Property | Type | Description |
| :-- | :-- | :-- |
| `schema` | GraphQLSchema | GraphQL schema. |
| `validationRules` | Array&lt;Function>? | Validation rules for [GraphQL.js `validate`](https://graphql.org/graphql-js/validation/#validate), in addition to the default [GraphQL.js `specifiedRules`](https://graphql.org/graphql-js/validation/#specifiedrules). |
| `rootValue` | \*? | Value passed to the first resolver. |
| `contextValue` | \*? | Execution context (usually an object) passed to resolvers. |
| `fieldResolver` | Function? | Custom default field resolver. |
| `override` | [ExecuteOptionsOverride](#type-executeoptionsoverride)? | Override any [`ExecuteOptions`](#type-executeoptions) (except `override`) per request. |

#### Examples

_[`execute`](#function-execute) middleware options that sets the schema once but populates the user in the GraphQL context from the Koa context each request._

> ```js
> import schema from './schema'
>
> const executeOptions = {
>   schema,
>   override: ctx => ({
>     contextValue: {
>       user: ctx.state.user
>     }
>   })
> }
> ```

---

### type ExecuteOptionsOverride

Overrides any [`ExecuteOptions`](#type-executeoptions) (except `override`) per request.

**Type:** Function

| Parameter | Type   | Description  |
| :-------- | :----- | :----------- |
| `context` | object | Koa context. |

**Returns:** [ExecuteOptions](#type-executeoptions) — [`execute`](#function-execute) middleware options.

#### Examples

_An [`execute`](#function-execute) middleware options override that populates the user in the GraphQL context from the Koa request context._

> ```js
> const executeOptionsOverride = ctx => ({
>   contextValue: {
>     user: ctx.state.user
>   }
> })
> ```
