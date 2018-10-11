import { Source, parse, validate, execute as executeGraphQL } from 'graphql'
import createError from 'http-errors'
import { isPlainObject } from './isPlainObject'
import { checkOptions } from './checkOptions'
import { checkSchema } from './checkSchema'

/**
 * Creates Koa middleware to execute GraphQL. Use after the
 * [`errorHandler`]{@link errorHandler} and
 * [body parser](https://npm.im/koa-bodyparser) middleware.
 * @kind function
 * @name execute
 * @param {ExecuteOptions} options Options.
 * @returns {function} Koa middleware.
 * @example <caption>A basic GraphQL API.</caption>
 * ```js
 * import Koa from 'koa'
 * import bodyParser from 'koa-bodyparser'
 * import { errorHandler, execute } from 'graphql-api-koa'
 * import schema from './schema'
 *
 * const app = new Koa()
 *   .use(errorHandler())
 *   .use(bodyParser())
 *   .use(execute({ schema }))
 * ```
 */
export const execute = options => {
  if (typeof options === 'undefined')
    throw createError('GraphQL execute middleware options missing.')

  if (!isPlainObject(options))
    throw createError('GraphQL execute middleware options must be an object.')

  const ALLOWED_OPTIONS = [
    'schema',
    'rootValue',
    'contextValue',
    'fieldResolver',
    'override'
  ]

  checkOptions(options, ALLOWED_OPTIONS, 'GraphQL execute middleware')

  if (typeof options.schema !== 'undefined') checkSchema(options.schema)

  if (
    typeof options.override !== 'undefined' &&
    typeof options.override !== 'function'
  )
    throw createError(
      'GraphQL execute middleware `override` option must be a function.'
    )

  return async (ctx, next) => {
    if (typeof ctx.request.body === 'undefined')
      throw createError('Request body missing.')

    if (!isPlainObject(ctx.request.body))
      throw createError(400, 'Request body must be a JSON object.')

    if (!('query' in ctx.request.body))
      throw createError(400, 'GraphQL operation field `query` missing.')

    let document

    try {
      document = parse(new Source(ctx.request.body.query))
    } catch (error) {
      throw createError(400, `GraphQL query syntax error: ${error.message}`)
    }

    let optionsOverride = {}

    if (options.override) {
      optionsOverride = await options.override(ctx)

      if (!isPlainObject(optionsOverride))
        throw createError(
          'GraphQL execute middleware options must be an object, or an object promise.'
        )

      checkOptions(
        optionsOverride,
        ALLOWED_OPTIONS.filter(option => option !== 'override'),
        'GraphQL execute middleware `override` option return'
      )

      if (typeof optionsOverride.schema !== 'undefined')
        checkSchema(optionsOverride.schema)
    }

    const execute = { ...options, ...optionsOverride }

    const queryValidationErrors = validate(execute.schema, document)
    if (queryValidationErrors.length)
      throw createError(400, 'GraphQL query validation errors.', {
        graphqlErrors: queryValidationErrors
      })

    let result

    try {
      result = await executeGraphQL({
        ...execute,
        document,
        variableValues: ctx.request.body.variables,
        operationName: ctx.request.body.operationName
      })
    } catch (error) {
      throw createError(
        400,
        `GraphQL operation field invalid: ${error.message}`
      )
    }

    if (result.data) ctx.response.body = { data: result.data }

    if (result.errors)
      throw createError(200, 'GraphQL errors.', {
        graphqlErrors: result.errors
      })

    ctx.response.status = 200

    await next()
  }
}

/**
 * GraphQL [`execute`]{@link execute} Koa middleware options.
 * @kind typedef
 * @name ExecuteOptions
 * @type {Object}
 * @prop {GraphQLSchema} schema GraphQL schema.
 * @prop {*} [rootValue] Value passed to the first resolver.
 * @prop {*} [contextValue] Execution context (usually an object) passed to resolvers.
 * @prop {function} [fieldResolver] Custom default field resolver.
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
 * @type {function}
 * @param {Object} context Koa context.
 * @returns {Object} Options.
 * @example <caption>An [`execute`]{@link execute} middleware options override that populates the user in the GraphQL context from the Koa request context.</caption>
 * ```js
 * const executeOptionsOverride = ctx => ({
 *   contextValue: {
 *     user: ctx.state.user
 *   }
 * })
 * ```
 */
