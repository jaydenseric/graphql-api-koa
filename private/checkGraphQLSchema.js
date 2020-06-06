'use strict';

const { GraphQLSchema, validateSchema } = require('graphql');
const createHttpError = require('http-errors');

/**
 * Validates a GraphQL schema.
 * @kind function
 * @name checkGraphQLSchema
 * @param {GraphQLSchema} schema GraphQL schema.
 * @param {string} errorMessagePrefix Error message prefix.
 * @ignore
 */
module.exports = function checkGraphQLSchema(schema, errorMessagePrefix) {
  if (!(schema instanceof GraphQLSchema))
    throw createHttpError(
      500,
      `${errorMessagePrefix} GraphQL schema must be a \`GraphQLSchema\` instance.`
    );

  const schemaValidationErrors = validateSchema(schema);

  if (schemaValidationErrors.length)
    throw createHttpError(
      500,
      `${errorMessagePrefix} has GraphQL schema validation errors.`,
      { graphqlErrors: schemaValidationErrors }
    );
};
