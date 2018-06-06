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
 * Creates Koa middleware to handle errors. Use this as the first to catch all
 * errors for {@link http://facebook.github.io/graphql/October2016/#sec-Errors a correctly formated GraphQL response}.
 * When intentionally throwing an error, create it with `status` and `expose`
 * properties using {@link https://npm.im/http-errors http-errors} or the
 * response will be a generic 500 error for security.
 * @returns {Function} Koa middleware.
 * @example <caption>How to throw an error determining the response.</caption>
 * import Koa from 'koa'
 * import bodyParser from 'koa-bodyparser'
 * import { errorHandler, execute } from 'graphql-api-koa'
 * import createError from 'http-errors'
 * import schema from './schema'
 *
 * const app = new Koa()
 *   .use(errorHandler())
 *   .use(async (ctx, next) => {
 *     if (
 *      // It’s Saturday.
 *      new Date().getDay() === 6
 *     )
 *       throw createError({
 *         message: 'No work on the sabbath.',
 *         status: 503,
 *         expose: true
 *       })
 *
 *     await next()
 *   })
 *   .use(bodyParser())
 *   .use(execute({ schema }))
 */
export const errorHandler = () => async (ctx, next) => {
  try {
    // Await all following middleware.
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
 * Creates Koa middleware to execute GraphQL. Use after the {@link errorHandler}
 * and {@link https://npm.im/koa-bodyparser body parser} middleware.
 * @param {ExecuteOptions} options Options.
 * @returns {Function} Koa middleware.
 * @example <caption>A basic GraphQL API.</caption>
 * import Koa from 'koa'
 * import bodyParser from 'koa-bodyparser'
 * import { errorHandler, execute } from 'graphql-api-koa'
 * import schema from './schema'
 *
 * const app = new Koa()
 *   .use(errorHandler())
 *   .use(bodyParser())
 *   .use(execute({ schema }))
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
 * Determines if a value is a plain object.
 * @param {*} value The value to check.
 * @returns {boolean} Is the value a plain object.
 * @private
 */
const isPlainObject = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Validates options conform to a whitelist.
 * @param {Object} options Options to validate.
 * @param {string[]} allowed Allowed option keys.
 * @param {string} description The start of the error message.
 * @private
 */
const checkOptions = (options, allowed, description) => {
  const invalid = Object.keys(options).filter(
    option => !allowed.includes(option)
  )

  if (invalid.length)
    throw createError(
      `${description} options invalid: \`${invalid.join('`, `')}\`.`
    )
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
 * GraphQL {@link execute} Koa middleware options.
 * @typedef {Object} ExecuteOptions
 * @prop {module:graphql.GraphQLSchema} schema GraphQL schema.
 * @prop {*} [rootValue] Value passed to the first resolver.
 * @prop {*} [contextValue] Execution context (usually an object) passed to resolvers.
 * @prop {Function} [fieldResolver] Custom default field resolver.
 * @prop {MiddlewareOptionsOverride} [override] Override any {@link ExecuteOptions} (except `override`) per request.
 * @example <caption>{@link execute} middleware options that sets the schema once but populates the user in the GraphQL context from the Koa context each request.</caption>
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
 */

/**
 * Per-request Koa middleware options override.
 * @callback MiddlewareOptionsOverride
 * @param {module:koa.Context} context Koa context.
 * @returns {Object} Options.
 * @example <caption>An {@link execute} middleware options override that populates the user in the GraphQL context from the Koa request context.</caption>
 * const executeOptionsOverride = ctx => ({
 *   contextValue: {
 *     user: ctx.state.user
 *   }
 * })
 */
