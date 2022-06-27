// @ts-check

import { GraphQLSchema, validateSchema } from "graphql";
import createHttpError from "http-errors";

import GraphQLAggregateError from "./GraphQLAggregateError.mjs";

/**
 * Validates a GraphQL schema.
 * @param {GraphQLSchema} schema GraphQL schema.
 * @param {string} errorMessagePrefix Error message prefix.
 */
export default function checkGraphQLSchema(schema, errorMessagePrefix) {
  if (!(schema instanceof GraphQLSchema))
    throw createHttpError(
      500,
      `${errorMessagePrefix} GraphQL schema must be a \`GraphQLSchema\` instance.`
    );

  const schemaValidationErrors = validateSchema(schema);

  if (schemaValidationErrors.length)
    throw new GraphQLAggregateError(
      schemaValidationErrors,
      `${errorMessagePrefix} has GraphQL schema validation errors.`,
      500,
      false
    );
}
