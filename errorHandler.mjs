// @ts-check

import createHttpError from "http-errors";

import GraphQLAggregateError from "./GraphQLAggregateError.mjs";

/**
 * Creates Koa middleware to handle errors. Use this before other middleware to
 * catch all errors for a correctly formatted
 * [GraphQL response](https://spec.graphql.org/October2021/#sec-Errors).
 *
 * Special {@link KoaMiddlewareError Koa middleware error} properties can be
 * used to determine how the error appears in the GraphQL response body
 * {@linkcode GraphQLResponseBody.errors errors} array and the response HTTP
 * status code.
 *
 * Additional custom Koa middleware can be used to customize the response.
 * @see [GraphQL spec for errors](https://spec.graphql.org/October2021/#sec-Errors).
 * @see [GraphQL over HTTP spec](https://github.com/graphql/graphql-over-http).
 * @see [Koa error handling docs](https://koajs.com/#error-handling).
 * @see [`http-errors`](https://npm.im/http-errors), also a Koa dependency.
 * @returns Koa middleware.
 * @example
 * A client error thrown in Koa middleware…
 *
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
 * Response has a 429 HTTP status code, with this body:
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
 * @example
 * A server error thrown in Koa middleware, not exposed to the client…
 *
 * Error:
 *
 * ```js
 * const error = new Error("Database connection failed.");
 * ```
 *
 * Response has a 500 HTTP status code, with this body:
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
 * @example
 * A server error thrown in Koa middleware, exposed to the client…
 *
 * Error:
 *
 * ```js
 * const error = new Error("Service unavailable due to maintenance.");
 * error.status = 503;
 * error.expose = true;
 * ```
 *
 * Response has a 503 HTTP status code, with this body:
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
 * @example
 * An error thrown in a GraphQL resolver, exposed to the client…
 *
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
 * Response has a 200 HTTP status code, with this body:
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
export default function errorHandler() {
  /**
   * Koa middleware to handle errors.
   * @param {import("koa").ParameterizedContext} ctx Koa context.
   * @param {() => Promise<unknown>} next
   */
  async function errorHandlerMiddleware(ctx, next) {
    try {
      // Await all following middleware.
      await next();
    } catch (error) {
      // Create response body if necessary. It may have been created after
      // GraphQL execution and contain data.
      if (typeof ctx.response.body !== "object" || ctx.response.body == null)
        ctx.response.body = {};

      const body = /** @type {GraphQLResponseBody} */ (ctx.response.body);

      if (
        error instanceof GraphQLAggregateError &&
        // GraphQL schema validation errors are not exposed.
        error.expose
      ) {
        // Error contains GraphQL query validation or execution errors.

        body.errors = error.errors.map((graphqlError) => {
          const formattedError = graphqlError.toJSON();

          return (
            // Originally thrown in resolvers (not a GraphQL validation error).
            graphqlError.originalError &&
              // Not specifically marked to be exposed to the client.
              !(
                /** @type {KoaMiddlewareError} */ (graphqlError.originalError)
                  .expose
              )
              ? {
                  ...formattedError,

                  // Overwrite the message to prevent client exposure. Wording
                  // is  consistent with the http-errors 500 server error
                  // message.
                  message: "Internal Server Error",
                }
              : formattedError
          );
        });

        // For GraphQL query validation errors the status will be 400. For
        // GraphQL execution errors the status will be 200; by convention they
        // shouldn’t result in a response error HTTP status code.
        ctx.response.status = error.status;
      } else {
        // Error is some other Koa middleware error, possibly GraphQL schema
        // validation errors.

        // Coerce the error to a HTTP error, in case it’s not one already.
        let httpError = createHttpError(
          // @ts-ignore Let the library handle an invalid error type.
          error
        );

        // If the error is not to be exposed to the client, use a generic 500
        // server error.
        if (!httpError.expose) {
          httpError = createHttpError(500);

          // Assume that an `extensions` property is intended to be exposed to
          // the client in the GraphQL response body `errors` array and isn’t
          // from something unrelated with a conflicting name.
          if (
            // Guard against a non enumerable object error, e.g. null.
            error instanceof Error &&
            typeof (/** @type {KoaMiddlewareError} */ (error).extensions) ===
              "object" &&
            /** @type {KoaMiddlewareError} */ (error).extensions != null
          )
            httpError.extensions = /** @type {KoaMiddlewareError} */ (
              error
            ).extensions;
        }

        body.errors = [
          "extensions" in httpError
            ? {
                message: httpError.message,
                extensions: httpError.extensions,
              }
            : {
                message: httpError.message,
              },
        ];

        ctx.response.status = httpError.status;
      }

      // Set the content-type.
      ctx.response.type = "application/graphql+json";

      // Support Koa app error listeners.
      ctx.app.emit("error", error, ctx);
    }
  }

  return errorHandlerMiddleware;
}

/**
 * An error thrown within Koa middleware following the
 * {@linkcode errorHandler} Koa middleware can have these special properties to
 * determine how the error appears in the GraphQL response body
 * {@linkcode GraphQLResponseBody.errors errors} array and the response HTTP
 * status code.
 * @see [GraphQL spec for errors](https://spec.graphql.org/October2021/#sec-Errors).
 * @see [Koa error handling docs](https://koajs.com/#error-handling).
 * @see [`http-errors`](https://npm.im/http-errors), also a Koa dependency.
 * @typedef {object} KoaMiddlewareError
 * @prop {string} message Error message. If the error
 *   {@linkcode KoaMiddlewareError.expose expose} property isn’t `true` or the
 *   {@linkcode KoaMiddlewareError.status status} property >= 500 (for non
 *   GraphQL resolver errors), the message is replaced with
 *   `Internal Server Error` in the GraphQL response body
 *   {@linkcode GraphQLResponseBody.errors errors} array.
 * @prop {number} [status] Determines the response HTTP status code. Not usable
 *   for GraphQL resolver errors as they shouldn’t prevent the GraphQL request
 *   from having a 200 HTTP status code.
 * @prop {boolean} [expose] Should the original error
 *   {@linkcode KoaMiddlewareError.message message} be exposed to the client.
 * @prop {{ [key: string]: unknown }} [extensions] A map of custom error data
 *   that is exposed to the client in the GraphQL response body
 *   {@linkcode GraphQLResponseBody.errors errors} array, regardless of the
 *   error {@linkcode KoaMiddlewareError.expose expose} or
 *   {@linkcode KoaMiddlewareError.status status} properties.
 */

/**
 * A GraphQL response body.
 * @see [GraphQL over HTTP spec](https://github.com/graphql/graphql-over-http).
 * @typedef {object} GraphQLResponseBody
 * @prop {Array<import("graphql").GraphQLFormattedError>} [errors] Errors.
 * @prop {{ [key: string]: unknown } | null} [data] Data.
 * @prop {{ [key: string]: unknown }} [extensions] Custom extensions to the
 *   GraphQL over HTTP protocol.
 */
