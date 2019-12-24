import { formatError } from 'graphql'
import { createHttpError } from './createHttpError.mjs'

/**
 * Creates Koa middleware to handle errors. Use this before other middleware to
 * catch all errors for a [correctly formated GraphQL response](http://facebook.github.io/graphql/October2016/#sec-Errors).
 * When intentionally throwing an error, create it with `status` and `expose`
 * properties using [http-errors](https://npm.im/http-errors) or the response
 * will be a generic 500 error for security.
 * @kind function
 * @name errorHandler
 * @returns {Function} Koa middleware.
 * @example <caption>How to throw an error determining the response.</caption>
 * ```js
 * import Koa from 'koa'
 * import bodyParser from 'koa-bodyparser'
 * import { errorHandler, execute } from 'graphql-api-koa'
 * import createError from 'http-errors'
 * import schema from './schema.mjs'
 *
 * const app = new Koa()
 *   .use(errorHandler())
 *   .use(async (ctx, next) => {
 *     if (
 *       // It’s Saturday.
 *       new Date().getDay() === 6
 *     )
 *       throw createError(503, 'No work on the sabbath.', { expose: true })
 *
 *     await next()
 *   })
 *   .use(bodyParser())
 *   .use(execute({ schema }))
 * ```
 */
export const errorHandler = () => async (ctx, next) => {
  try {
    // Await all following middleware.
    await next()
  } catch (error) {
    // Use, or coerce to, a HttpError instance.
    let httpError = createHttpError(error)

    // Use a generic 500 error if the error is not to be exposed to the client.
    if (!httpError.expose) httpError = createHttpError()

    ctx.response.status = httpError.status

    // Create response body if necessary. It may have been created after GraphQL
    // execution and contain data.
    if (!ctx.response.body) ctx.response.body = {}

    // This error handler should be the only middleware that sets the response
    // body errors.
    ctx.response.body.errors = Array.isArray(httpError.graphqlErrors)
      ? // GraphQL execution errors.
        httpError.graphqlErrors.map(graphqlError => {
          const formattedError = formatError(graphqlError)

          if (
            // Originally thrown in resolvers (not a GraphQL validation error).
            graphqlError.originalError &&
            // Not specifically marked to be exposed to the client.
            !graphqlError.originalError.expose
          )
            // Overwrite the message to prevent client exposure. Wording is
            // consistent with the http-errors 500 error message.
            formattedError.message = 'Internal Server Error'

          return formattedError
        })
      : // A middleware error.
        [formatError(httpError)]

    // Support Koa app error listeners.
    ctx.app.emit('error', error, ctx)
  }
}
