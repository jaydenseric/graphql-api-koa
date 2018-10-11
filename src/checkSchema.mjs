import { GraphQLSchema, validateSchema } from 'graphql'
import createError from 'http-errors'

/**
 * Validates a GraphQL schema.
 * @kind function
 * @name checkSchema
 * @param {GraphQLSchema} schema GraphQL schema.
 * @ignore
 */
export const checkSchema = schema => {
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
