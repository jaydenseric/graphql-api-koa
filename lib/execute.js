'use strict';

const {
  Source,
  execute: graphqlExecute,
  parse,
  specifiedRules,
  validate,
} = require('graphql');
const isObject = require('isobject');
const checkGraphQLSchema = require('./checkGraphQLSchema');
const checkGraphQLValidationRules = require('./checkGraphQLValidationRules');
const checkOptions = require('./checkOptions');
const createHttpError = require('./createHttpError');

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
 * const Koa = require('koa')
 * const bodyParser = require('koa-bodyparser')
 * const { errorHandler, execute } = require('graphql-api-koa')
 * const schema = require('./schema')
 *
 * const app = new Koa()
 *   .use(errorHandler())
 *   .use(bodyParser())
 *   .use(execute({ schema }))
 * ```
 */
module.exports = function execute(options) {
  if (typeof options === 'undefined')
    throw createHttpError('GraphQL execute middleware options missing.');

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
      'GraphQL execute middleware `execute` option must be a function.'
    );

  const { override, ...staticOptions } = options;

  if (typeof override !== 'undefined' && typeof override !== 'function')
    throw createHttpError(
      'GraphQL execute middleware `override` option must be a function.'
    );

  return async (ctx, next) => {
    if (typeof ctx.request.body === 'undefined')
      throw createHttpError('Request body missing.');

    if (!isObject(ctx.request.body))
      throw createHttpError(400, 'Request body must be a JSON object.');

    if (!('query' in ctx.request.body))
      throw createHttpError(400, 'GraphQL operation field `query` missing.');

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
      throw createHttpError(
        400,
        `GraphQL query syntax error: ${error.message}`
      );
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

    if (errors)
      throw createHttpError(200, 'GraphQL errors.', {
        graphqlErrors: errors,
      });

    ctx.response.status = 200;

    await next();
  };
};
