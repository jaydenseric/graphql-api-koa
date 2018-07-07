# graphql-api-koa

[![Build status](https://travis-ci.org/jaydenseric/graphql-api-koa.svg)](https://travis-ci.org/jaydenseric/graphql-api-koa) [![npm version](https://img.shields.io/npm/v/graphql-api-koa.svg)](https://npm.im/graphql-api-koa)

GraphQL API Koa middleware.

## Setup

To install [`graphql-api-koa`](https://npm.im/graphql-api-koa) and [`graphql`](https://npm.im/graphql) from [npm](https://npmjs.com) run:

```sh
npm install graphql-api-koa graphql
```

See the [execute middleware](#execute) examples to get started.

## API

### Table of contents

- [type ExecuteOptions](#type-executeoptions)
  - [Examples](#examples)
- [type MiddlewareOptionsOverride](#type-middlewareoptionsoverride)
  - [Examples](#examples-1)
- [function errorHandler](#function-errorhandler)
  - [Examples](#examples-2)
- [function execute](#function-execute)
  - [Examples](#examples-3)

### type ExecuteOptions

GraphQL [`execute`](#function-execute) Koa middleware options.

**Type:** [Object](https://developer.mozilla.org/javascript/reference/global_objects/Object)

| Property      | Type                                                          | Description                                                                            |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| schema        | GraphQLSchema                                                 | GraphQL schema.                                                                        |
| rootValue     | \*?                                                           | Value passed to the first resolver.                                                    |
| contextValue  | \*?                                                           | Execution context (usually an object) passed to resolvers.                             |
| fieldResolver | function?                                                     | Custom default field resolver.                                                         |
| override      | [MiddlewareOptionsOverride](#type-middlewareoptionsoverride)? | Override any [`ExecuteOptions`](#type-executeoptions) (except `override`) per request. |

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

### type MiddlewareOptionsOverride

Per-request Koa middleware options override.

**Type:** function

| Parameter | Type                                                                               | Description  |
| --------- | ---------------------------------------------------------------------------------- | ------------ |
| context   | [Object](https://developer.mozilla.org/javascript/reference/global_objects/Object) | Koa context. |

#### Examples

_An [`execute`](#function-execute) middleware options override that populates the user in the GraphQL context from the Koa request context._

> ```js
> const executeOptionsOverride = ctx => ({
>   contextValue: {
>     user: ctx.state.user
>   }
> })
> ```

### function errorHandler

Creates Koa middleware to handle errors. Use this as the first to catch all errors for a [correctly formated GraphQL response](http://facebook.github.io/graphql/October2016/#sec-Errors). When intentionally throwing an error, create it with `status` and `expose` properties using [http-errors](https://npm.im/http-errors) or the response will be a generic 500 error for security.

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

### function execute

Creates Koa middleware to execute GraphQL. Use after the [`errorHandler`](#function-errorhandler) and [body parser](https://npm.im/koa-bodyparser) middleware.

| Parameter | Type                                   | Description |
| --------- | -------------------------------------- | ----------- |
| options   | [ExecuteOptions](#type-executeoptions) | Options.    |

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
