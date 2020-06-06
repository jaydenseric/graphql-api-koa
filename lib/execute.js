'use strict';

const {
  Source,
  execute: graphqlExecute,
  parse,
  specifiedRules,
  validate,
} = require('graphql');
const createHttpError = require('http-errors');
const isObject = require('isobject');
const checkGraphQLSchema = require('./checkGraphQLSchema');
const checkGraphQLValidationRules = require('./checkGraphQLValidationRules');
const checkOptions = require('./checkOptions');

/**
 * List of [`ExecuteOptions`]{@link ExecuteOptions} keys allowed for static
 * config, for validation purposes.
 * @kind constant
 * @name ALLOWED_EXECUTE_OPTIONS_STATIC
 * @type {Array<string>}
 * @ignore
 */
const ALLOWED_EXECUTE_OPTIONS_STATIC = [
  'schema',
  'validationRules',
  'rootValue',
  'contextValue',
  'fieldResolver',
  'execute',
  'override',
];

/**
 * List of [`ExecuteOptions`]{@link ExecuteOptions} keys allowed for per request
 * override config, for validation purposes.
 * @kind constant
 * @name ALLOWED_EXECUTE_OPTIONS_OVERRIDE
 * @type {Array<string>}
 * @ignore
 */
const ALLOWED_EXECUTE_OPTIONS_OVERRIDE = ALLOWED_EXECUTE_OPTIONS_STATIC.filter(
  (option) => option !== 'override'
);

/**
 * Creates Koa middleware to execute GraphQL. Use after the
 * [`errorHandler`]{@link errorHandler} and
 * [body parser](https://npm.im/koa-bodyparser) middleware.
 * @kind function
 * @name execute
 * @param {ExecuteOptions} options Options.
 * @returns {Function} Koa middleware.
 * @example <caption>A basic GraphQL API.</caption>
 * ```js
 * const Koa = require('koa');
 * const bodyParser = require('koa-bodyparser');
 * const { errorHandler, execute } = require('graphql-api-koa');
 * const schema = require('./schema');
 *
 * const app = new Koa()
 *   .use(errorHandler())
 *   .use(bodyParser())
 *   .use(execute({ schema }));
 * ```
 */
module.exports = function execute(options) {
  if (typeof options === 'undefined')
    throw createHttpError(500, 'GraphQL execute middleware options missing.');

  checkOptions(
    options,
    ALLOWED_EXECUTE_OPTIONS_STATIC,
    'GraphQL execute middleware'
  );

  if (typeof options.schema !== 'undefined')
    checkGraphQLSchema(
      options.schema,
      'GraphQL execute middleware `schema` option'
    );

  if (typeof options.validationRules !== 'undefined')
    checkGraphQLValidationRules(
      options.validationRules,
      'GraphQL execute middleware `validationRules` option'
    );

  if (
    typeof options.execute !== 'undefined' &&
    typeof options.execute !== 'function'
  )
    throw createHttpError(
      500,
      'GraphQL execute middleware `execute` option must be a function.'
    );

  const { override, ...staticOptions } = options;

  if (typeof override !== 'undefined' && typeof override !== 'function')
    throw createHttpError(
      500,
      'GraphQL execute middleware `override` option must be a function.'
    );

  return async (ctx, next) => {
    if (typeof ctx.request.body === 'undefined')
      throw createHttpError(500, 'Request body missing.');

    if (!isObject(ctx.request.body))
      throw createHttpError(400, 'Request body must be a JSON object.');

    if (!('query' in ctx.request.body))
      throw createHttpError(400, 'GraphQL operation field `query` missing.');

    if (typeof ctx.request.body.query !== 'string')
      throw createHttpError(
        400,
        'GraphQL operation field `query` must be a string.'
      );

    if (
      'variables' in ctx.request.body &&
      !isObject(ctx.request.body.variables)
    )
      throw createHttpError(
        400,
        'Request body JSON `variables` field must be an object.'
      );

    let document;

    try {
      document = parse(new Source(ctx.request.body.query));
    } catch (error) {
      throw createHttpError(400, 'GraphQL query syntax errors.', {
        graphqlErrors: [error],
      });
    }

    let overrideOptions;

    if (override) {
      overrideOptions = await override(ctx);

      checkOptions(
        overrideOptions,
        ALLOWED_EXECUTE_OPTIONS_OVERRIDE,
        'GraphQL execute middleware `override` option resolved'
      );

      if (typeof overrideOptions.schema !== 'undefined')
        checkGraphQLSchema(
          overrideOptions.schema,
          'GraphQL execute middleware `override` option resolved `schema` option'
        );

      if (typeof overrideOptions.validationRules !== 'undefined')
        checkGraphQLValidationRules(
          overrideOptions.validationRules,
          'GraphQL execute middleware `override` option resolved `validationRules` option'
        );

      if (
        typeof overrideOptions.execute !== 'undefined' &&
        typeof overrideOptions.execute !== 'function'
      )
        throw createHttpError(
          500,
          'GraphQL execute middleware `override` option resolved `execute` option must be a function.'
        );
    }

    const requestOptions = {
      validationRules: [],
      execute: graphqlExecute,
      ...staticOptions,
      ...overrideOptions,
    };

    if (typeof requestOptions.schema === 'undefined')
      throw createHttpError(
        500,
        'GraphQL execute middleware requires a GraphQL schema.'
      );

    const queryValidationErrors = validate(requestOptions.schema, document, [
      ...specifiedRules,
      ...requestOptions.validationRules,
    ]);

    if (queryValidationErrors.length)
      throw createHttpError(400, 'GraphQL query validation errors.', {
        graphqlErrors: queryValidationErrors,
      });

    const { data, errors } = await requestOptions.execute({
      schema: requestOptions.schema,
      rootValue: requestOptions.rootValue,
      contextValue: requestOptions.contextValue,
      fieldResolver: requestOptions.fieldResolver,
      document,
      variableValues: ctx.request.body.variables,
      operationName: ctx.request.body.operationName,
    });

    if (data) ctx.response.body = { data };

    ctx.response.status = 200;

    if (errors) {
      // By convention GraphQL execution errors shouldn’t result in an error
      // HTTP status code. `http-errors` can’t be used to create this error
      // because it doesn’t allow a non-error 200 status, see:
      // https://github.com/jshttp/http-errors/issues/50#issuecomment-395107925
      const error = new Error('GraphQL execution errors.');
      error.graphqlErrors = errors;
      error.status = 200;
      error.expose = true;

      throw error;
    }

    await next();
  };
};
