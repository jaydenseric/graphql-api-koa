'use strict';

exports.errorHandler = require('./errorHandler');
exports.execute = require('./execute');

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
 * const schema = require('./schema')
 *
 * const executeOptions = {
 *   schema,
 *   override: ctx => ({
 *     contextValue: {
 *       user: ctx.state.user
 *     }
 *   })
 * }
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
 * const executeOptionsOverride = ctx => ({
 *   contextValue: {
 *     user: ctx.state.user
 *   }
 * })
 * ```
 */
