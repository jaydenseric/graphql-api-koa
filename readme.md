![graphql-api-koa logo](https://cdn.jsdelivr.net/gh/jaydenseric/graphql-api-koa@1.1.1/graphql-api-koa-logo.svg)

# graphql-api-koa

[![npm version](https://badgen.net/npm/v/graphql-api-koa)](https://npm.im/graphql-api-koa) [![CI status](https://github.com/jaydenseric/graphql-api-koa/workflows/CI/badge.svg)](https://github.com/jaydenseric/graphql-api-koa/actions)

[GraphQL](https://graphql.org) execution and error handling middleware written from scratch for [Koa](https://koajs.com).

## Setup

To install [`graphql-api-koa`](https://npm.im/graphql-api-koa) and the [`graphql`](https://npm.im/graphql) peer dependency with [npm](https://npmjs.com/get-npm), run:

```sh
npm install graphql-api-koa graphql
```

See the [`execute`](#function-execute) middleware examples to get started.

## API

- [function errorHandler](#function-errorhandler)
- [function execute](#function-execute)
- [type ErrorGraphQLResolver](#type-errorgraphqlresolver)
- [type ErrorKoaMiddleware](#type-errorkoamiddleware)
- [type ExecuteOptions](#type-executeoptions)
- [type ExecuteOptionsOverride](#type-executeoptionsoverride)

### function errorHandler

Creates Koa middleware to handle errors. Use this before other middleware to catch all errors for a correctly formatted [GraphQL response](https://spec.graphql.org/June2018/#sec-Errors).

[Special Koa middleware error properties](#type-errorkoamiddleware) can be used to determine how the error appears in the response payload `errors` array and the response HTTP status code.

[Special GraphQL resolver error properties](#type-errorgraphqlresolver) can be used to determine how the error appears in the response payload `errors` array.

Additional custom Koa middleware can be used to customize the response.

**Returns:** Function — Koa middleware.

#### Examples

_How to import._

> ```js
> import errorHandler from 'graphql-api-koa/errorHandler.mjs';
> ```

---

### function execute

Creates Koa middleware to execute GraphQL. Use after the [`errorHandler`](#function-errorhandler) and [body parser](https://npm.im/koa-bodyparser) middleware.

| Parameter | Type                                   | Description |
| :-------- | :------------------------------------- | :---------- |
| `options` | [ExecuteOptions](#type-executeoptions) | Options.    |

**Returns:** Function — Koa middleware.

#### Examples

_How to import._

> ```js
> import execute from 'graphql-api-koa/execute.mjs';
> ```

_A basic GraphQL API._

> ```js
> import Koa from 'koa';
> import bodyParser from 'koa-bodyparser';
> import errorHandler from 'graphql-api-koa/errorHandler.mjs';
> import execute from 'graphql-api-koa/execute.mjs';
> import schema from './schema.mjs';
>
> const app = new Koa()
>   .use(errorHandler())
>   .use(
>     bodyParser({
>       extendTypes: {
>         json: 'application/graphql+json',
>       },
>     })
>   )
>   .use(execute({ schema }));
> ```

---

### type ErrorGraphQLResolver

A GraphQL resolver error may have these special properties for the [`errorHandler`](#function-errorhandler) Koa middleware to use to determine how the error appears in the response payload `errors` array.

**Type:** object

| Property | Type | Description |
| :-- | :-- | :-- |
| `message` | string | Error message. If the error `expose` property isn’t `true`, the message is replaced with `Internal Server Error` in the response payload `errors` array. |
| `extensions` | object\<string, \*>? | A map of custom error data that is exposed to the client in the response payload `errors` array, regardless of the error `expose` or `status` properties. |
| `expose` | boolean? | Should the original error `message` be exposed to the client. |

#### See

- [GraphQL spec for errors](https://spec.graphql.org/June2018/#sec-Errors).

#### Examples

_An error thrown in a GraphQL resolver, exposed to the client._

> Query:
>
> ```graphql
> {
>   user(handle: "jaydenseric") {
>     name
>     email
>   }
> }
> ```
>
> Error thrown in the `User.email` resolver:
>
> ```js
> const error = new Error('Unauthorized access to user data.');
> error.expose = true;
> ```
>
> Response has a 200 HTTP status code, with this payload:
>
> ```json
> {
>   "errors": [
>     {
>       "message": "Unauthorized access to user data.",
>       "locations": [{ "line": 4, "column": 5 }],
>       "path": ["user", "email"]
>     }
>   ],
>   "data": {
>     "user": {
>       "name": "Jayden Seric",
>       "email": null
>     }
>   }
> }
> ```

---

### type ErrorKoaMiddleware

A Koa middleware error may have these special properties for the [`errorHandler`](#function-errorhandler) Koa middleware to use to determine how the error appears in the response payload `errors` array and the response HTTP status code.

**Type:** object

| Property | Type | Description |
| :-- | :-- | :-- |
| `message` | string | Error message. If the error `status` property >= 500 or the error `expose` property isn’t `true`, the message is replaced with `Internal Server Error` in the response payload `errors` array. |
| `extensions` | object\<string, \*>? | A map of custom error data that is exposed to the client in the response payload `errors` array, regardless of the error `expose` or `status` properties. |
| `status` | number? | Determines the response HTTP status code. |
| `expose` | boolean? | Should the original error `message` be exposed to the client. |

#### See

- [GraphQL spec for errors](https://spec.graphql.org/June2018/#sec-Errors).
- [Koa error handling docs](https://koajs.com/#error-handling).
- [`http-errors`](https://npm.im/http-errors), used by this package and Koa.

#### Examples

_A client error thrown in Koa middleware._

> Error constructed manually:
>
> ```js
> const error = new Error('Rate limit exceeded.');
> error.extensions = {
>   code: 'RATE_LIMIT_EXCEEDED',
> };
> error.status = 429;
> ```
>
> Error constructed using [`http-errors`](https://npm.im/http-errors):
>
> ```js
> import createHttpError from 'http-errors';
>
> const error = createHttpError(429, 'Rate limit exceeded.', {
>   extensions: {
>     code: 'RATE_LIMIT_EXCEEDED',
>   },
> });
> ```
>
> Response has a 429 HTTP status code, with this payload:
>
> ```json
> {
>   "errors": [
>     {
>       "message": "Rate limit exceeded.",
>       "extensions": {
>         "code": "RATE_LIMIT_EXCEEDED"
>       }
>     }
>   ]
> }
> ```

_A server error thrown in Koa middleware, not exposed to the client._

> Error:
>
> ```js
> const error = new Error('Database connection failed.');
> ```
>
> Response has a 500 HTTP status code, with this payload:
>
> ```json
> {
>   "errors": [
>     {
>       "message": "Internal Server Error"
>     }
>   ]
> }
> ```

_A server error thrown in Koa middleware, exposed to the client._

> Error:
>
> ```js
> const error = new Error('Service unavailable due to maintenance.');
> error.status = 503;
> error.expose = true;
> ```
>
> Response has a 503 HTTP status code, with this payload:
>
> ```json
> {
>   "errors": [
>     {
>       "message": "Service unavailable due to maintenance."
>     }
>   ]
> }
> ```

---

### type ExecuteOptions

[`execute`](#function-execute) Koa middleware options.

**Type:** object

| Property | Type | Description |
| :-- | :-- | :-- |
| `schema` | GraphQLSchema | GraphQL schema. |
| `validationRules` | Array\<Function>? | Validation rules for [GraphQL.js `validate`](https://graphql.org/graphql-js/validation/#validate), in addition to the default [GraphQL.js `specifiedRules`](https://graphql.org/graphql-js/validation/#specifiedrules). |
| `rootValue` | \*? | Value passed to the first resolver. |
| `contextValue` | \*? | Execution context (usually an object) passed to resolvers. |
| `fieldResolver` | Function? | Custom default field resolver. |
| `execute` | Function? | Replacement for [GraphQL.js `execute`](https://graphql.org/graphql-js/execution/#execute). |
| `override` | [ExecuteOptionsOverride](#type-executeoptionsoverride)? | Override any [`ExecuteOptions`](#type-executeoptions) (except `override`) per request. |

#### Examples

_[`execute`](#function-execute) middleware options that sets the schema once but populates the user in the GraphQL context from the Koa context each request._

> ```js
> import schema from './schema.mjs';
>
> const executeOptions = {
>   schema,
>   override: (ctx) => ({
>     contextValue: {
>       user: ctx.state.user,
>     },
>   }),
> };
> ```

---

### type ExecuteOptionsOverride

Overrides any [`ExecuteOptions`](#type-executeoptions) (except `override`) per request.

**Type:** Function

| Parameter | Type   | Description  |
| :-------- | :----- | :----------- |
| `context` | object | Koa context. |

**Returns:** object — [`execute`](#function-execute) middleware options subset.

#### Examples

_An [`execute`](#function-execute) middleware options override that populates the user in the GraphQL context from the Koa request context._

> ```js
> const executeOptionsOverride = (ctx) => ({
>   contextValue: {
>     user: ctx.state.user,
>   },
> });
> ```
