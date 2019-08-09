import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import t from 'tap'
import { checkGraphQLSchema } from './checkGraphQLSchema'

t.test('`checkGraphQLSchema` with a valid GraphQL schema.', t => {
  t.doesNotThrow(
    () =>
      checkGraphQLSchema(
        new GraphQLSchema({
          query: new GraphQLObjectType({
            name: 'Query',
            fields: {
              test: {
                type: GraphQLString
              }
            }
          })
        }),
        'Test'
      ),
    'Doesn’t throw.'
  )
  t.end()
})

t.test('`checkGraphQLSchema` with a non GraphQL schema.', t => {
  t.throws(
    () => checkGraphQLSchema(false, 'Test'),
    {
      name: 'InternalServerError',
      message: 'Test GraphQL schema must be a `GraphQLSchema` instance.',
      status: 500,
      statusCode: 500,
      expose: false
    },
    'Throws.'
  )
  t.end()
})

t.test('`checkGraphQLSchema` with GraphQL schema validation errors.', t => {
  t.throws(
    () => checkGraphQLSchema(new GraphQLSchema({}), 'Test'),
    {
      name: 'InternalServerError',
      message: 'Test has GraphQL schema validation errors.',
      status: 500,
      statusCode: 500,
      expose: false,
      graphqlErrors: [
        {
          name: 'GraphQLError',
          message: 'Query root type must be provided.'
        }
      ]
    },
    'Throws.'
  )
  t.end()
})
