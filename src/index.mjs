import compose from 'koa-compose'
import bodyParser from 'koa-bodyparser'
import createError from 'http-errors'
import {
  GraphQLSchema,
  validateSchema,
  Source,
  parse,
  validate,
  execute as executeGraphQL,
  formatError
} from 'graphql'

/**
 * Determines if a value is a plain object.
 * @param {*} value The value to check.
 * @returns {boolean} Is the value a plain object.
 * @private
 */
const isPlainObject = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * GraphQL error handler Koa middleware. Use this middleware first to catch all
 * middleware errors and correctly format a GraphQL response. Errors thrown
 * outside resolvers without an `expose` property and `true` value are masked by
 * a generic 500 error.
 * @see {@link http://facebook.github.io/graphql/October2016/#sec-Errors GraphQL Draft RFC Specification October 2016 § 7.2.2}
 * @see {@link https://npm.im/http-errors http-errors on npm.}
 * @returns {Function} Koa middleware.
 */
export const errorHandler = () => async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    // Use, or coerce to, a HttpError instance.
    let httpError = createError(error)

    // Use a generic 500 error if the error is not to be exposed to the client.
    if (!httpError.expose) httpError = createError()

    ctx.response.status = httpError.status

    // Create response body if necessary. It may have been created after GraphQL
    // execution and contain data.
    if (!ctx.response.body) ctx.response.body = {}

    // This error handler should be the only middleware that sets the response
    // body errors.
    ctx.response.body.errors = Array.isArray(httpError.graphqlErrors)
      ? // Simultaneous errors (e.g. during validation).
        httpError.graphqlErrors.map(formatError)
      : // Single error.
        [formatError(httpError)]

    // Support Koa app error listeners.
    ctx.app.emit('error', error, ctx)
  }
}

/**
 * Validates a GraphQL schema.
 * @param {module:graphql.GraphQLSchema} schema GraphQL schema.
 * @private
 */
const checkSchema = schema => {
  if (!(schema instanceof GraphQLSchema))
    throw createError(
      'GraphQL schema is required and must be a `GraphQLSchema` instance.'
    )

  const schemaValidationErrors = validateSchema(schema)
  if (schemaValidationErrors.length)
    throw createError('GraphQL schema validation errors.', {
      graphqlErrors: schemaValidationErrors
    })
}

/**
 * Creates GraphQL execution Koa middleware.
 * @param {ExecuteOptions} options Options.
 * @returns {Function} Koa middleware.
 */
export const execute = options => {
  if (typeof options === 'undefined')
    throw createError('GraphQL execute middleware options missing.')

  if (!isPlainObject(options))
    throw createError('GraphQL execute middleware options must be an object.')

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

    if (result.data) ctx.body = { data: result.data }

    if (result.errors)
      throw createError(200, 'GraphQL errors.', {
        graphqlErrors: result.errors
      })

    ctx.response.status = 200

    await next()
  }
}

/**
 * Composes a Koa middleware GraphQL preset that includes request body parsing,
 * GraphQL execution and error handling.
 * @param {Options} options Options.
 * @param {ExecuteOptions} options.execute Execute middleware options.
 * @returns {Function} Koa middleware.
 * @example <caption>A basic GraphQL API.</caption>
 * import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql'
 * import { graphqlPreset } from 'graphql-api-koa'
 * import Koa from 'koa'
 *
 * const app = new Koa().use(
 *   graphqlPreset({
 *     execute: {
 *       schema: new GraphQLSchema({
 *         query: new GraphQLObjectType({
 *           name: 'Query',
 *           fields: {
 *             hello: {
 *               type: GraphQLString,
 *               resolve: () => 'Hi.'
 *             }
 *           }
 *         })
 *       })
 *     }
 *   })
 * )
 */
export const graphqlPreset = ({ execute: executeOptions } = {}) =>
  compose([errorHandler(), bodyParser(), execute(executeOptions)])

/**
 * GraphQL execute Koa middleware options.
 * @typedef {Object} ExecuteOptions
 * @prop {module:graphql.GraphQLSchema} schema GraphQL schema.
 * @prop {*} [rootValue] Value passed to the first resolver.
 * @prop {*} [contextValue] Execution context (usually an object) passed to resolvers.
 * @prop {Function} [fieldResolver] Custom default field resolver.
 * @prop {Override} [override] Override options per request.
 */

/**
 * Overrides Koa middleware options per-request.
 * @callback Override
 * @param {module:koa.Context} context Koa context.
 * @returns {Object} Options.
 */
