import { GraphQLSchema, validateSchema } from 'graphql'
import { createHttpError } from './createHttpError'

/**
 * Validates a GraphQL schema.
 * @kind function
 * @name checkSchema
 * @param {GraphQLSchema} schema GraphQL schema.
 * @ignore
 */
export const checkSchema = schema => {
  if (!(schema instanceof GraphQLSchema))
    throw createHttpError(
      'GraphQL schema is required and must be a `GraphQLSchema` instance.'
    )

  const schemaValidationErrors = validateSchema(schema)
  if (schemaValidationErrors.length)
    throw createHttpError('GraphQL schema validation errors.', {
      graphqlErrors: schemaValidationErrors
    })
}
