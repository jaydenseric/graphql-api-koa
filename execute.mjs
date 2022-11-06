// @ts-check

import {
  execute as graphqlExecute,
  parse,
  Source,
  specifiedRules,
  validate,
} from "graphql";
import createHttpError from "http-errors";

import assertKoaContextRequestGraphQL from "./assertKoaContextRequestGraphQL.mjs";
import checkGraphQLSchema from "./checkGraphQLSchema.mjs";
import checkGraphQLValidationRules from "./checkGraphQLValidationRules.mjs";
import checkOptions from "./checkOptions.mjs";
import GraphQLAggregateError from "./GraphQLAggregateError.mjs";

/**
 * List of {@linkcode ExecuteOptions} keys allowed for per request override
 * config, for validation purposes.
 */
const ALLOWED_EXECUTE_OPTIONS_OVERRIDE = /** @type {const} */ ([
  "schema",
  "validationRules",
  "rootValue",
  "contextValue",
  "fieldResolver",
  "execute",
]);

/**
 * List of {@linkcode ExecuteOptions} keys allowed for static config, for
 * validation purposes.
 */
const ALLOWED_EXECUTE_OPTIONS_STATIC = /** @type {const} */ ([
  ...ALLOWED_EXECUTE_OPTIONS_OVERRIDE,
  "override",
]);

/**
 * Creates Koa middleware to execute GraphQL. Use after the `errorHandler` and
 * [body parser](https://npm.im/koa-bodyparser) middleware.
 * @template [KoaContextState=import("koa").DefaultState]
 * @template [KoaContext=import("koa").DefaultContext]
 * @param {ExecuteOptions & {
 *   override?: (
 *     context: import("./assertKoaContextRequestGraphQL.mjs")
 *       .KoaContextRequestGraphQL<KoaContextState, KoaContext>
 *   ) => Partial<ExecuteOptions> | Promise<Partial<ExecuteOptions>>,
 * }} options Options.
 * @returns Koa middleware.
 * @example
 * A basic GraphQL API:
 *
 * ```js
 * import Koa from "koa";
 * import bodyParser from "koa-bodyparser";
 * import errorHandler from "graphql-api-koa/errorHandler.mjs";
 * import execute from "graphql-api-koa/execute.mjs";
 * import schema from "./schema.mjs";
 *
 * const app = new Koa()
 *   .use(errorHandler())
 *   .use(
 *     bodyParser({
 *       extendTypes: {
 *         json: "application/graphql+json",
 *       },
 *     })
 *   )
 *   .use(execute({ schema }));
 * ```
 * @example
 * {@linkcode execute} middleware options that sets the schema once but
 * populates the user in the GraphQL context from the Koa context each request:
 *
 * ```js
 * import schema from "./schema.mjs";
 *
 * const executeOptions = {
 *   schema,
 *   override: (ctx) => ({
 *     contextValue: {
 *       user: ctx.state.user,
 *     },
 *   }),
 * };
 * ```
 * @example
 * An {@linkcode execute} middleware options override that populates the user in
 * the GraphQL context from the Koa context:
 *
 * ```js
 * const executeOptionsOverride = (ctx) => ({
 *   contextValue: {
 *     user: ctx.state.user,
 *   },
 * });
 * ```
 */
export default function execute(options) {
  if (typeof options === "undefined")
    throw createHttpError(500, "GraphQL execute middleware options missing.");

  checkOptions(
    options,
    ALLOWED_EXECUTE_OPTIONS_STATIC,
    "GraphQL execute middleware"
  );

  if (typeof options.schema !== "undefined")
    checkGraphQLSchema(
      options.schema,
      "GraphQL execute middleware `schema` option"
    );

  if (typeof options.validationRules !== "undefined")
    checkGraphQLValidationRules(
      options.validationRules,
      "GraphQL execute middleware `validationRules` option"
    );

  if (
    typeof options.execute !== "undefined" &&
    typeof options.execute !== "function"
  )
    throw createHttpError(
      500,
      "GraphQL execute middleware `execute` option must be a function."
    );

  const { override, ...staticOptions } = options;

  if (typeof override !== "undefined" && typeof override !== "function")
    throw createHttpError(
      500,
      "GraphQL execute middleware `override` option must be a function."
    );

  /**
   * Koa middleware to execute GraphQL.
   * @param {import("koa").ParameterizedContext<
   *   KoaContextState,
   *   KoaContext
   * >} ctx Koa context. The `ctx.request.body` property is conventionally added
   *   by Koa body parser middleware such as
   *   [`koa-bodyparser`](https://npm.im/koa-bodyparser).
   * @param {() => Promise<unknown>} next
   */
  async function executeMiddleware(ctx, next) {
    assertKoaContextRequestGraphQL(ctx);

    /**
     * Parsed GraphQL operation query.
     * @type {import("graphql").DocumentNode}
     */
    let document;

    try {
      document = parse(new Source(ctx.request.body.query));
    } catch (error) {
      throw new GraphQLAggregateError(
        [/** @type {import("graphql").GraphQLError} */ (error)],
        "GraphQL query syntax errors.",
        400,
        true
      );
    }

    let overrideOptions;

    if (override) {
      overrideOptions = await override(ctx);

      checkOptions(
        overrideOptions,
        ALLOWED_EXECUTE_OPTIONS_OVERRIDE,
        "GraphQL execute middleware `override` option resolved"
      );

      if (typeof overrideOptions.schema !== "undefined")
        checkGraphQLSchema(
          overrideOptions.schema,
          "GraphQL execute middleware `override` option resolved `schema` option"
        );

      if (typeof overrideOptions.validationRules !== "undefined")
        checkGraphQLValidationRules(
          overrideOptions.validationRules,
          "GraphQL execute middleware `override` option resolved `validationRules` option"
        );

      if (
        typeof overrideOptions.execute !== "undefined" &&
        typeof overrideOptions.execute !== "function"
      )
        throw createHttpError(
          500,
          "GraphQL execute middleware `override` option resolved `execute` option must be a function."
        );
    }

    const requestOptions = {
      validationRules: [],
      execute: graphqlExecute,
      ...staticOptions,
      ...overrideOptions,
    };

    if (typeof requestOptions.schema === "undefined")
      throw createHttpError(
        500,
        "GraphQL execute middleware requires a GraphQL schema."
      );

    const queryValidationErrors = validate(requestOptions.schema, document, [
      ...specifiedRules,
      ...requestOptions.validationRules,
    ]);

    if (queryValidationErrors.length)
      throw new GraphQLAggregateError(
        queryValidationErrors,
        "GraphQL query validation errors.",
        400,
        true
      );

    const { data, errors } = await requestOptions.execute({
      schema: requestOptions.schema,
      rootValue: requestOptions.rootValue,
      contextValue: requestOptions.contextValue,
      fieldResolver: requestOptions.fieldResolver,
      document,
      variableValues: ctx.request.body.variables,
      operationName: ctx.request.body.operationName,
    });

    if (data)
      ctx.response.body =
        /** @type {import("./errorHandler.mjs").GraphQLResponseBody} */ ({
          data,
        });

    ctx.response.status = 200;

    if (errors) {
      // By convention GraphQL execution errors shouldn’t result in an error
      // HTTP status code.
      throw new GraphQLAggregateError(
        errors,
        "GraphQL execution errors.",
        200,
        true
      );
    }

    // Set the content-type.
    ctx.response.type = "application/graphql+json";

    await next();
  }

  return executeMiddleware;
}

/**
 * {@linkcode execute} Koa middleware options.
 * @typedef {object} ExecuteOptions
 * @prop {import("graphql").GraphQLSchema} schema GraphQL schema.
 * @prop {ReadonlyArray<import("graphql").ValidationRule>} [validationRules]
 *   Validation rules for GraphQL.js {@linkcode validate}, in addition to the
 *   default GraphQL.js {@linkcode specifiedRules}.
 * @prop {any} [rootValue] Value passed to the first resolver.
 * @prop {any} [contextValue] Execution context (usually an object) passed to
 *   resolvers.
 * @prop {import("graphql").GraphQLFieldResolver<any, any>} [fieldResolver]
 *   Custom default field resolver.
 * @prop {typeof graphqlExecute} [execute] Replacement for
 *   [GraphQL.js `execute`](https://graphql.org/graphql-js/execution/#execute).
 */
