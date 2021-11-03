import createHttpError from 'http-errors';

/**
 * Creates Koa middleware to handle errors. Use this before other middleware to
 * catch all errors for a correctly formatted [GraphQL response](https://spec.graphql.org/June2018/#sec-Errors).
 *
 * [Special Koa middleware error properties]{@link ErrorKoaMiddleware} can be
 * used to determine how the error appears in the response payload `errors`
 * array and the response HTTP status code.
 *
 * [Special GraphQL resolver error properties]{@link ErrorGraphQLResolver} can
 * be used to determine how the error appears in the response payload `errors`
 * array.
 *
 * Additional custom Koa middleware can be used to customize the response.
 * @kind function
 * @name errorHandler
 * @returns {Function} Koa middleware.
 * @example <caption>Ways to `import`.</caption>
 * ```js
 * import { errorHandler } from 'graphql-api-koa';
 * ```
 *
 * ```js
 * import errorHandler from 'graphql-api-koa/public/errorHandler.mjs';
 * ```
 */
export default function errorHandler() {
  return async function errorHandlerMiddleware(ctx, next) {
    try {
      // Await all following middleware.
      await next();
    } catch (error) {
      // Create response body if necessary. It may have been created after
      // GraphQL execution and contain data.
      if (!ctx.response.body) ctx.response.body = {};

      if (
        // Guard against a non enumerable object error, e.g. null.
        error instanceof Error &&
        Array.isArray(error.graphqlErrors) &&
        error.status !== 500
      ) {
        // Error contains GraphQL query validation or execution errors.

        ctx.response.body.errors = error.graphqlErrors.map((graphqlError) => {
          const formattedError = graphqlError.toJSON();

          if (
            // Originally thrown in resolvers (not a GraphQL validation error).
            graphqlError.originalError &&
            // Not specifically marked to be exposed to the client.
            !graphqlError.originalError.expose
          )
            // Overwrite the message to prevent client exposure. Wording is
            // consistent with the http-errors 500 server error message.
            formattedError.message = 'Internal Server Error';

          return formattedError;
        });

        // For GraphQL query validation errors the status will be 400. For
        // GraphQL execution errors the status will be 200; by convention they
        // shouldn’t result in a response error HTTP status code.
        if (error.status) ctx.response.status = error.status;
      } else {
        // Error is some other Koa middleware error, possibly GraphQL schema
        // validation errors.

        // Coerce the error to a HTTP error, in case it’s not one already.
        let httpError = createHttpError(error);

        // If the error is not to be exposed to the client, use a generic 500
        // server error.
        if (!httpError.expose) {
          httpError = createHttpError(500);

          // Assume that an `extensions` property is intended to be exposed to
          // the client in the response payload `errors` array and isn’t from
          // something unrelated with a conflicting name.
          if (
            // Guard against a non enumerable object error, e.g. null.
            error instanceof Error &&
            error.extensions
          )
            httpError.extensions = error.extensions;
        }

        const formattedError = {
          message: httpError.message,
          locations: httpError.locations,
          path: httpError.path,
        };

        if (httpError.extensions)
          formattedError.extensions = httpError.extensions;

        ctx.response.body.errors = [formattedError];
        ctx.response.status = httpError.status;
      }

      // Set the content-type.
      ctx.response.type = 'application/graphql+json';

      // Support Koa app error listeners.
      ctx.app.emit('error', error, ctx);
    }
  };
}
