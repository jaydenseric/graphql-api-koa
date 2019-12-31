'use strict'

const { doesNotThrow, throws } = require('assert')
const {
  GraphQLError,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} = require('graphql')
const checkGraphQLSchema = require('../../lib/checkGraphQLSchema')

module.exports = tests => {
  tests.add('`checkGraphQLSchema` with a valid GraphQL schema.', () => {
    doesNotThrow(() =>
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
      )
    )
  })

  tests.add('`checkGraphQLSchema` with a non GraphQL schema.', () => {
    throws(() => checkGraphQLSchema(false, 'Test'), {
      name: 'InternalServerError',
      message: 'Test GraphQL schema must be a `GraphQLSchema` instance.',
      status: 500,
      expose: false
    })
  })

  tests.add(
    '`checkGraphQLSchema` with GraphQL schema validation errors.',
    () => {
      throws(() => checkGraphQLSchema(new GraphQLSchema({}), 'Test'), {
        name: 'InternalServerError',
        message: 'Test has GraphQL schema validation errors.',
        status: 500,
        expose: false,
        graphqlErrors: [new GraphQLError('Query root type must be provided.')]
      })
    }
  )
}
