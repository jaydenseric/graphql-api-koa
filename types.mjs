/**
 * A GraphQL resolver error may have these special properties for the
 * [`errorHandler`]{@link errorHandler} Koa middleware to use to determine how
 * the error appears in the response payload `errors` array.
 * @kind typedef
 * @name ErrorGraphQLResolver
 * @type {object}
 * @prop {string} message Error message. If the error `expose` property isn’t `true`, the message is replaced with `Internal Server Error` in the response payload `errors` array.
 * @prop {object<string, *>} [extensions] A map of custom error data that is exposed to the client in the response payload `errors` array, regardless of the error `expose` or `status` properties.
 * @prop {boolean} [expose] Should the original error `message` be exposed to the client.
 * @see [GraphQL spec for errors](https://spec.graphql.org/June2018/#sec-Errors).
 * @example <caption>An error thrown in a GraphQL resolver, exposed to the client.</caption>
 * Query:
 *
 * ```graphql
 * {
 *   user(handle: "jaydenseric") {
 *     name
 *     email
 *   }
 * }
 * ```
 *
 * Error thrown in the `User.email` resolver:
 *
 * ```js
 * const error = new Error("Unauthorized access to user data.");
 * error.expose = true;
 * ```
 *
 * Response has a 200 HTTP status code, with this payload:
 *
 * ```json
 * {
 *   "errors": [
 *     {
 *       "message": "Unauthorized access to user data.",
 *       "locations": [{ "line": 4, "column": 5 }],
 *       "path": ["user", "email"]
 *     }
 *   ],
 *   "data": {
 *     "user": {
 *       "name": "Jayden Seric",
 *       "email": null
 *     }
 *   }
 * }
 * ```
 */

/**
 * A Koa middleware error may have these special properties for the
 * [`errorHandler`]{@link errorHandler} Koa middleware to use to determine how
 * the error appears in the response payload `errors` array and the response
 * HTTP status code.
 * @kind typedef
 * @name ErrorKoaMiddleware
 * @type {object}
 * @prop {string} message Error message. If the error `status` property >= 500 or the error `expose` property isn’t `true`, the message is replaced with `Internal Server Error` in the response payload `errors` array.
 * @prop {object<string, *>} [extensions] A map of custom error data that is exposed to the client in the response payload `errors` array, regardless of the error `expose` or `status` properties.
 * @prop {number} [status] Determines the response HTTP status code.
 * @prop {boolean} [expose] Should the original error `message` be exposed to the client.
 * @see [GraphQL spec for errors](https://spec.graphql.org/June2018/#sec-Errors).
 * @see [Koa error handling docs](https://koajs.com/#error-handling).
 * @see [`http-errors`](https://npm.im/http-errors), used by this package and Koa.
 * @example <caption>A client error thrown in Koa middleware.</caption>
 * Error constructed manually:
 *
 * ```js
 * const error = new Error("Rate limit exceeded.");
 * error.extensions = {
 *   code: "RATE_LIMIT_EXCEEDED",
 * };
 * error.status = 429;
 * ```
 *
 * Error constructed using [`http-errors`](https://npm.im/http-errors):
 *
 * ```js
 * import createHttpError from "http-errors";
 *
 * const error = createHttpError(429, "Rate limit exceeded.", {
 *   extensions: {
 *     code: "RATE_LIMIT_EXCEEDED",
 *   },
 * });
 * ```
 *
 * Response has a 429 HTTP status code, with this payload:
 *
 * ```json
 * {
 *   "errors": [
 *     {
 *       "message": "Rate limit exceeded.",
 *       "extensions": {
 *         "code": "RATE_LIMIT_EXCEEDED"
 *       }
 *     }
 *   ]
 * }
 * ```
 * @example <caption>A server error thrown in Koa middleware, not exposed to the client.</caption>
 * Error:
 *
 * ```js
 * const error = new Error("Database connection failed.");
 * ```
 *
 * Response has a 500 HTTP status code, with this payload:
 *
 * ```json
 * {
 *   "errors": [
 *     {
 *       "message": "Internal Server Error"
 *     }
 *   ]
 * }
 * ```
 * @example <caption>A server error thrown in Koa middleware, exposed to the client.</caption>
 * Error:
 *
 * ```js
 * const error = new Error("Service unavailable due to maintenance.");
 * error.status = 503;
 * error.expose = true;
 * ```
 *
 * Response has a 503 HTTP status code, with this payload:
 *
 * ```json
 * {
 *   "errors": [
 *     {
 *       "message": "Service unavailable due to maintenance."
 *     }
 *   ]
 * }
 * ```
 */

/**
 * [`execute`]{@link execute} Koa middleware options.
 * @kind typedef
 * @name ExecuteOptions
 * @type {object}
 * @prop {GraphQLSchema} schema GraphQL schema.
 * @prop {Array<Function>} [validationRules] Validation rules for [GraphQL.js `validate`](https://graphql.org/graphql-js/validation/#validate), in addition to the default [GraphQL.js `specifiedRules`](https://graphql.org/graphql-js/validation/#specifiedrules).
 * @prop {*} [rootValue] Value passed to the first resolver.
 * @prop {*} [contextValue] Execution context (usually an object) passed to resolvers.
 * @prop {Function} [fieldResolver] Custom default field resolver.
 * @prop {Function} [execute] Replacement for [GraphQL.js `execute`](https://graphql.org/graphql-js/execution/#execute).
 * @prop {ExecuteOptionsOverride} [override] Override any [`ExecuteOptions`]{@link ExecuteOptions} (except `override`) per request.
 * @example <caption>[`execute`]{@link execute} middleware options that sets the schema once but populates the user in the GraphQL context from the Koa context each request.</caption>
 * ```js
 * import schema from "./schema.mjs";
 *
 * const executeOptions = {
 *   schema,
 *   override: (ctx) => ({
 *     contextValue: {
 *       user: ctx.state.user,
 *     },
 *   }),
 * };
 * ```
 */

/**
 * Overrides any [`ExecuteOptions`]{@link ExecuteOptions} (except `override`)
 * per request.
 * @kind typedef
 * @name ExecuteOptionsOverride
 * @type {Function}
 * @param {object} context Koa context.
 * @returns {object} [`execute`]{@link execute} middleware options subset.
 * @example <caption>An [`execute`]{@link execute} middleware options override that populates the user in the GraphQL context from the Koa request context.</caption>
 * ```js
 * const executeOptionsOverride = (ctx) => ({
 *   contextValue: {
 *     user: ctx.state.user,
 *   },
 * });
 * ```
 */
