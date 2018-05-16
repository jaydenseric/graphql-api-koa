import { GraphQLSchema, validateSchema } from 'graphql'
import {
  OptionsTypeError,
  SchemaTypeError,
  SchemaValidationError
} from './errors'

export const graphqlHTTP = options => async (ctx, next) => {
  if (typeof options === 'undefined')
    throw new OptionsTypeError('Koa GraphQL middleware requires options.', 500)

  const resolvedOptions = await Promise.resolve(
    typeof options === 'function' ? options(ctx) : options
  )

  if (typeof resolvedOptions !== 'object' || resolvedOptions === null)
    throw new OptionsTypeError(
      'Koa GraphQL middleware options must be an object, or an object promise.',
      500
    )

  if (!(options.schema instanceof GraphQLSchema))
    throw new SchemaTypeError(
      'Koa GraphQL middleware `schema` option must be a `GraphQLSchema` instance.',
      500
    )

  const schemaValidationErrors = validateSchema(options.schema)
  if (schemaValidationErrors.length)
    throw new SchemaValidationError(
      `Koa GraphQL middleware \`schema\` option validation errors: ${schemaValidationErrors.join(
        ' '
      )}`,
      500
    )

  await next()
}
