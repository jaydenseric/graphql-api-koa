// @ts-check

import { GraphQLError } from "graphql";

/**
 * An aggregate error for GraphQL schema validation, query validation, or
 * execution errors.
 */
export default class GraphQLAggregateError
  // Todo: Use `AggregateError` instead of `Error`, once it’s available in all
  // supported Node.js versions.
  extends Error
{
  /**
   * @param {ReadonlyArray<import("graphql").GraphQLError>} errors GraphQL
   *   errors.
   * @param {string} message Aggregate error message.
   * @param {number} status Determines the response HTTP status code.
   * @param {boolean} expose Should the original error {@linkcode message} be
   *   exposed to the client. Note that individual {@linkcode errors} that
   *   represent GraphQL execution errors thrown in resolvers have an
   *   {@linkcode GraphQLError.originalError originalError} property that may
   *   have an `expose` property.
   */
  constructor(errors, message, status, expose) {
    if (!Array.isArray(errors))
      throw new TypeError("Argument 1 `errors` must be an array.");

    if (!errors.every((error) => error instanceof GraphQLError))
      throw new TypeError(
        "Argument 1 `errors` must be an array containing only `GraphQLError` instances."
      );

    if (typeof message !== "string")
      throw new TypeError("Argument 2 `message` must be a string.");

    if (typeof status !== "number")
      throw new TypeError("Argument 3 `status` must be a number.");

    if (typeof expose !== "boolean")
      throw new TypeError("Argument 4 `expose` must be a boolean.");

    super(message);

    this.name = "GraphQLAggregateError";

    /** GraphQL errors. */
    this.errors = [...errors];

    /** Determines the response HTTP status code. */
    this.status = status;

    /**
     * Should the {@linkcode GraphQLAggregateError.message message} be exposed
     * to the client.
     */
    this.expose = expose;
  }
}
