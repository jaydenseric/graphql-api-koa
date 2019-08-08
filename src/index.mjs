export { errorHandler } from './errorHandler'
export { execute } from './execute'

/**
 * GraphQL [`execute`]{@link execute} Koa middleware options.
 * @kind typedef
 * @name ExecuteOptions
 * @type {object}
 * @prop {GraphQLSchema} schema GraphQL schema.
 * @prop {*} [rootValue] Value passed to the first resolver.
 * @prop {*} [contextValue] Execution context (usually an object) passed to resolvers.
 * @prop {Function} [fieldResolver] Custom default field resolver.
 * @prop {MiddlewareOptionsOverride} [override] Override any [`ExecuteOptions`]{@link ExecuteOptions} (except `override`) per request.
 * @example <caption>[`execute`]{@link execute} middleware options that sets the schema once but populates the user in the GraphQL context from the Koa context each request.</caption>
 * ```js
 * import schema from './schema'
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
 * Per-request Koa middleware options override.
 * @kind typedef
 * @name MiddlewareOptionsOverride
 * @type {Function}
 * @param {object} context Koa context.
 * @returns {object} Options.
 * @example <caption>An [`execute`]{@link execute} middleware options override that populates the user in the GraphQL context from the Koa request context.</caption>
 * ```js
 * const executeOptionsOverride = ctx => ({
 *   contextValue: {
 *     user: ctx.state.user
 *   }
 * })
 * ```
 */
