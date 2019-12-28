'use strict'

const { deepStrictEqual, ok, strictEqual, throws } = require('assert')
const {
  GraphQLError,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} = require('graphql')
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const errorHandler = require('../lib/errorHandler')
const execute = require('../lib/execute')
const fetchJsonAtPort = require('./fetchJsonAtPort')
const startServer = require('./startServer')

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      test: {
        type: GraphQLString
      }
    }
  })
})

module.exports = tests => {
  tests.add('`execute` middleware options missing.', () => {
    throws(() => execute(), {
      name: 'InternalServerError',
      message: 'GraphQL execute middleware options missing.',
      status: 500,
      expose: false
    })
  })

  tests.add('`execute` middleware options not an object.', () => {
    throws(() => execute(true), {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware options must be an enumerable object.',
      status: 500,
      expose: false
    })
  })

  tests.add('`execute` middleware options invalid.', () => {
    throws(() => execute({ schema, invalid1: true, invalid2: true }), {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware options invalid: `invalid1`, `invalid2`.',
      status: 500,
      expose: false
    })
  })

  tests.add('`execute` middleware option `override` not a function.', () => {
    throws(() => execute({ schema, override: true }), {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware `override` option must be a function.',
      status: 500,
      expose: false
    })
  })

  tests.add(
    '`execute` middleware option `override` returning not an object.',
    async () => {
      let koaError

      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(
          execute({
            schema,
            override: () => true
          })
        )
        .on('error', error => {
          koaError = error
        })

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ test }' })
        })

        ok(koaError instanceof Error)
        strictEqual(koaError.name, 'InternalServerError')
        strictEqual(
          koaError.message,
          'GraphQL execute middleware `override` option resolved options must be an enumerable object.'
        )
        strictEqual(koaError.status, 500)
        strictEqual(koaError.expose, false)
        strictEqual(response.status, 500)
        deepStrictEqual(await response.json(), {
          errors: [{ message: 'Internal Server Error' }]
        })
      } finally {
        close()
      }
    }
  )

  tests.add(
    '`execute` middleware option `override` returning options invalid.',
    async () => {
      let koaError

      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(
          execute({
            schema,
            override: () => ({
              invalid: true,
              override: true
            })
          })
        )
        .on('error', error => {
          koaError = error
        })

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ test }' })
        })

        ok(koaError instanceof Error)
        strictEqual(koaError.name, 'InternalServerError')
        strictEqual(
          koaError.message,
          'GraphQL execute middleware `override` option resolved options invalid: `invalid`, `override`.'
        )
        strictEqual(koaError.status, 500)
        strictEqual(koaError.expose, false)
        strictEqual(response.status, 500)
        deepStrictEqual(await response.json(), {
          errors: [{ message: 'Internal Server Error' }]
        })
      } finally {
        close()
      }
    }
  )

  tests.add('`execute` middleware option `validationRules`.', async () => {
    let koaError

    const error1 = {
      message: 'Message.',
      locations: [{ line: 1, column: 1 }]
    }
    const error2 = {
      message: 'Cannot query field "wrong" on type "Query".',
      locations: [{ line: 1, column: 3 }]
    }

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(
        execute({
          schema,
          validationRules: [
            context => ({
              OperationDefinition(node) {
                context.reportError(new GraphQLError(error1.message, [node]))
              }
            })
          ]
        })
      )
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, {
        body: JSON.stringify({ query: '{ wrong }' })
      })

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'BadRequestError')
      strictEqual(koaError.message, 'GraphQL query validation errors.')
      strictEqual(koaError.status, 400)
      strictEqual(koaError.expose, true)
      strictEqual(Array.isArray(koaError.graphqlErrors), true)
      strictEqual(koaError.graphqlErrors.length, 2)
      strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
      strictEqual(koaError.graphqlErrors[0].message, error1.message)
      deepStrictEqual(koaError.graphqlErrors[0].locations, error1.locations)
      strictEqual(koaError.graphqlErrors[1].name, 'GraphQLError')
      strictEqual(koaError.graphqlErrors[1].message, error2.message)
      deepStrictEqual(koaError.graphqlErrors[1].locations, error2.locations)
      strictEqual(response.status, 400)
      deepStrictEqual(await response.json(), {
        errors: [error1, error2]
      })
    } finally {
      close()
    }
  })

  tests.add(
    '`execute` middleware option `validationRules` override.',
    async () => {
      let koaError

      const error1 = {
        message: 'Message overridden.',
        locations: [{ line: 1, column: 1 }]
      }
      const error2 = {
        message: 'Cannot query field "wrong" on type "Query".',
        locations: [{ line: 1, column: 3 }]
      }

      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(
          execute({
            schema,
            validationRules: [
              context => ({
                OperationDefinition(node) {
                  context.reportError(new GraphQLError('Message.', [node]))
                }
              })
            ],
            override: () => ({
              validationRules: [
                context => ({
                  OperationDefinition(node) {
                    context.reportError(
                      new GraphQLError('Message overridden.', [node])
                    )
                  }
                })
              ]
            })
          })
        )
        .on('error', error => {
          koaError = error
        })

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ wrong }' })
        })

        ok(koaError instanceof Error)
        strictEqual(koaError.name, 'BadRequestError')
        strictEqual(koaError.message, 'GraphQL query validation errors.')
        strictEqual(koaError.status, 400)
        strictEqual(koaError.expose, true)
        strictEqual(Array.isArray(koaError.graphqlErrors), true)
        strictEqual(koaError.graphqlErrors.length, 2)
        strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
        strictEqual(koaError.graphqlErrors[0].message, error1.message)
        deepStrictEqual(koaError.graphqlErrors[0].locations, error1.locations)
        strictEqual(koaError.graphqlErrors[1].name, 'GraphQLError')
        strictEqual(koaError.graphqlErrors[1].message, error2.message)
        deepStrictEqual(koaError.graphqlErrors[1].locations, error2.locations)
        strictEqual(response.status, 400)
        deepStrictEqual(await response.json(), {
          errors: [error1, error2]
        })
      } finally {
        close()
      }
    }
  )

  tests.add('`execute` middleware option `rootValue`.', async () => {
    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(
        execute({
          schema: new GraphQLSchema({
            query: new GraphQLObjectType({
              name: 'Query',
              fields: {
                test: {
                  type: GraphQLString,
                  resolve: value => value
                }
              }
            })
          }),
          rootValue: 'rootValue'
        })
      )

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, {
        body: JSON.stringify({ query: '{ test }' })
      })

      strictEqual(response.status, 200)
      deepStrictEqual(await response.json(), {
        data: { test: 'rootValue' }
      })
    } finally {
      close()
    }
  })

  tests.add(
    '`execute` middleware option `rootValue` override using Koa ctx.',
    async () => {
      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(async (ctx, next) => {
          ctx.state.test = 'rootValueOverridden'
          await next()
        })
        .use(
          execute({
            schema: new GraphQLSchema({
              query: new GraphQLObjectType({
                name: 'Query',
                fields: {
                  test: {
                    type: GraphQLString,
                    resolve: value => value
                  }
                }
              })
            }),
            rootValue: 'rootValue',
            override: ctx => ({ rootValue: ctx.state.test })
          })
        )

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ test }' })
        })

        strictEqual(response.status, 200)
        deepStrictEqual(await response.json(), {
          data: { test: 'rootValueOverridden' }
        })
      } finally {
        close()
      }
    }
  )

  tests.add('`execute` middleware option `contextValue`.', async () => {
    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(
        execute({
          schema: new GraphQLSchema({
            query: new GraphQLObjectType({
              name: 'Query',
              fields: {
                test: {
                  type: GraphQLString,
                  resolve: (value, args, context) => context
                }
              }
            })
          }),
          contextValue: 'contextValue'
        })
      )

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, {
        body: JSON.stringify({ query: '{ test }' })
      })

      strictEqual(response.status, 200)
      deepStrictEqual(await response.json(), {
        data: { test: 'contextValue' }
      })
    } finally {
      close()
    }
  })

  tests.add(
    '`execute` middleware option `contextValue` override using Koa ctx.',
    async () => {
      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(async (ctx, next) => {
          ctx.state.test = 'contextValueOverridden'
          await next()
        })
        .use(
          execute({
            schema: new GraphQLSchema({
              query: new GraphQLObjectType({
                name: 'Query',
                fields: {
                  test: {
                    type: GraphQLString,
                    resolve: (value, args, context) => context
                  }
                }
              })
            }),
            contextValue: 'contextValue',
            override: ctx => ({
              contextValue: ctx.state.test
            })
          })
        )

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ test }' })
        })

        strictEqual(response.status, 200)
        deepStrictEqual(await response.json(), {
          data: { test: 'contextValueOverridden' }
        })
      } finally {
        close()
      }
    }
  )

  tests.add(
    '`execute` middleware option `contextValue` override using Koa ctx async.',
    async () => {
      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(async (ctx, next) => {
          ctx.state.test = 'contextValueOverridden'
          await next()
        })
        .use(
          execute({
            schema: new GraphQLSchema({
              query: new GraphQLObjectType({
                name: 'Query',
                fields: {
                  test: {
                    type: GraphQLString,
                    resolve: (value, args, context) => context
                  }
                }
              })
            }),
            contextValue: 'contextValue',
            override: async ctx => ({ contextValue: ctx.state.test })
          })
        )

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ test }' })
        })

        strictEqual(response.status, 200)
        deepStrictEqual(await response.json(), {
          data: { test: 'contextValueOverridden' }
        })
      } finally {
        close()
      }
    }
  )

  tests.add('`execute` middleware option `fieldResolver`.', async () => {
    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(
        execute({
          schema,
          fieldResolver: () => 'fieldResolver'
        })
      )

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, {
        body: JSON.stringify({ query: '{ test }' })
      })

      strictEqual(response.status, 200)
      deepStrictEqual(await response.json(), {
        data: { test: 'fieldResolver' }
      })
    } finally {
      close()
    }
  })

  tests.add(
    '`execute` middleware option `fieldResolver` override using Koa ctx.',
    async () => {
      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(async (ctx, next) => {
          ctx.state.test = 'fieldResolverOverridden'
          await next()
        })
        .use(
          execute({
            schema,
            fieldResolver: () => 'fieldResolver',
            override: ctx => ({
              fieldResolver: () => ctx.state.test
            })
          })
        )

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ test }' })
        })

        strictEqual(response.status, 200)
        deepStrictEqual(await response.json(), {
          data: { test: 'fieldResolverOverridden' }
        })
      } finally {
        close()
      }
    }
  )

  tests.add(
    '`execute` middleware option `schema` not a GraphQLSchema instance.',
    () => {
      throws(() => execute({ schema: true }), {
        name: 'InternalServerError',
        message:
          'GraphQL execute middleware `schema` option GraphQL schema must be a `GraphQLSchema` instance.',
        status: 500,
        expose: false
      })
    }
  )

  tests.add(
    '`execute` middleware option `schema` undefined, without an override.',
    async () => {
      let koaError

      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(execute({ schema: undefined }))
        .on('error', error => {
          koaError = error
        })

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ test }' })
        })

        ok(koaError instanceof Error)
        strictEqual(koaError.name, 'InternalServerError')
        strictEqual(
          koaError.message,
          'GraphQL execute middleware requires a GraphQL schema.'
        )
        strictEqual(koaError.status, 500)
        strictEqual(koaError.expose, false)
        strictEqual(response.status, 500)
        deepStrictEqual(await response.json(), {
          errors: [{ message: 'Internal Server Error' }]
        })
      } finally {
        close()
      }
    }
  )

  tests.add(
    '`execute` middleware option `schema` not a GraphQLSchema instance override.',
    async () => {
      let koaError

      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(
          execute({
            schema,
            override: () => ({ schema: true })
          })
        )
        .on('error', error => {
          koaError = error
        })

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ test }' })
        })

        ok(koaError instanceof Error)
        strictEqual(koaError.name, 'InternalServerError')
        strictEqual(
          koaError.message,
          'GraphQL execute middleware `override` option resolved `schema` option GraphQL schema must be a `GraphQLSchema` instance.'
        )
        strictEqual(koaError.status, 500)
        strictEqual(koaError.expose, false)
        strictEqual(response.status, 500)
        deepStrictEqual(await response.json(), {
          errors: [{ message: 'Internal Server Error' }]
        })
      } finally {
        close()
      }
    }
  )

  tests.add('`execute` middleware option `schema` invalid GraphQL.', () => {
    throws(() => execute({ schema: new GraphQLSchema({}) }), {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware `schema` option has GraphQL schema validation errors.',
      status: 500,
      statusCode: 500,
      expose: false,
      graphqlErrors: [new GraphQLError('Query root type must be provided.')]
    })
  })

  tests.add(
    '`execute` middleware option `schema` invalid GraphQL override.',
    async () => {
      let koaError

      const app = new Koa()
        .use(errorHandler())
        .use(bodyParser())
        .use(
          execute({
            schema,
            override: () => ({ schema: new GraphQLSchema({}) })
          })
        )
        .on('error', error => {
          koaError = error
        })

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port, {
          body: JSON.stringify({ query: '{ test }' })
        })

        ok(koaError instanceof Error)
        strictEqual(koaError.name, 'InternalServerError')
        strictEqual(
          koaError.message,
          'GraphQL execute middleware `override` option resolved `schema` option has GraphQL schema validation errors.'
        )
        strictEqual(koaError.status, 500)
        strictEqual(koaError.expose, false)
        strictEqual(Array.isArray(koaError.graphqlErrors), true)
        strictEqual(koaError.graphqlErrors.length, 1)
        strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
        strictEqual(
          koaError.graphqlErrors[0].message,
          'Query root type must be provided.'
        )
        strictEqual(response.status, 500)
        deepStrictEqual(await response.json(), {
          errors: [{ message: 'Internal Server Error' }]
        })
      } finally {
        close()
      }
    }
  )

  tests.add(
    'Request body missing due to absent body parser middleware.',
    async () => {
      let koaError

      const app = new Koa()
        .use(errorHandler())
        .use(execute({ schema }))
        .on('error', error => {
          koaError = error
        })

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port)

        ok(koaError instanceof Error)
        strictEqual(koaError.name, 'InternalServerError')
        strictEqual(koaError.message, 'Request body missing.')
        strictEqual(koaError.status, 500)
        strictEqual(koaError.expose, false)
        strictEqual(response.status, 500)
        deepStrictEqual(await response.json(), {
          errors: [{ message: 'Internal Server Error' }]
        })
      } finally {
        close()
      }
    }
  )

  tests.add('Request body invalid.', async () => {
    let koaError

    const errorMessage = 'Request body must be a JSON object.'

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(execute({ schema }))
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, { body: '[]' })

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'BadRequestError')
      strictEqual(koaError.message, errorMessage)
      strictEqual(koaError.status, 400)
      strictEqual(koaError.expose, true)
      strictEqual(response.status, 400)
      deepStrictEqual(await response.json(), {
        errors: [{ message: errorMessage }]
      })
    } finally {
      close()
    }
  })

  tests.add('Operation field `query` missing.', async () => {
    let koaError

    const errorMessage = 'GraphQL operation field `query` missing.'

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(execute({ schema }))
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, { body: '{}' })

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'BadRequestError')
      strictEqual(koaError.message, errorMessage)
      strictEqual(koaError.status, 400)
      strictEqual(koaError.expose, true)
      strictEqual(response.status, 400)
      deepStrictEqual(await response.json(), {
        errors: [{ message: errorMessage }]
      })
    } finally {
      close()
    }
  })

  tests.add('Operation field `query` invalid.', async () => {
    let koaError

    const errorMessage =
      'GraphQL query syntax error: Syntax Error: Unexpected ['

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(execute({ schema }))
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, {
        body: JSON.stringify({ query: '[]' })
      })

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'BadRequestError')
      strictEqual(koaError.message, errorMessage)
      strictEqual(koaError.status, 400)
      strictEqual(koaError.expose, true)
      strictEqual(response.status, 400)
      deepStrictEqual(await response.json(), {
        errors: [{ message: errorMessage }]
      })
    } finally {
      close()
    }
  })

  tests.add('Operation field `variables` invalid.', async () => {
    let koaError

    const errorMessage =
      'GraphQL operation field invalid: Variables must be provided as an Object where each property is a variable value. Perhaps look to see if an unparsed JSON string was provided.'

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(execute({ schema }))
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, {
        body: JSON.stringify({ query: '{ test }', variables: '[]' })
      })

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'BadRequestError')
      strictEqual(koaError.message, errorMessage)
      strictEqual(koaError.status, 400)
      strictEqual(koaError.expose, true)
      strictEqual(response.status, 400)
      deepStrictEqual(await response.json(), {
        errors: [{ message: errorMessage }]
      })
    } finally {
      close()
    }
  })

  tests.add('Operation field `query` validation errors.', async () => {
    let koaError

    const error1 = {
      message: 'Cannot query field "wrongOne" on type "Query".',
      locations: [{ line: 1, column: 9 }]
    }
    const error2 = {
      message: 'Cannot query field "wrongTwo" on type "Query".',
      locations: [{ line: 1, column: 19 }]
    }

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(execute({ schema }))
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, {
        body: JSON.stringify({ query: '{ test, wrongOne, wrongTwo }' })
      })

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'BadRequestError')
      strictEqual(koaError.message, 'GraphQL query validation errors.')
      strictEqual(koaError.status, 400)
      strictEqual(koaError.expose, true)
      strictEqual(Array.isArray(koaError.graphqlErrors), true)
      strictEqual(koaError.graphqlErrors.length, 2)
      strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
      strictEqual(koaError.graphqlErrors[0].message, error1.message)
      deepStrictEqual(koaError.graphqlErrors[0].locations, error1.locations)
      strictEqual(koaError.graphqlErrors[1].name, 'GraphQLError')
      strictEqual(koaError.graphqlErrors[1].message, error2.message)
      deepStrictEqual(koaError.graphqlErrors[1].locations, error2.locations)
      strictEqual(response.status, 400)
      deepStrictEqual(await response.json(), {
        errors: [error1, error2]
      })
    } finally {
      close()
    }
  })

  tests.add('GraphQL resolver error unexposed.', async () => {
    let koaError
    let resolverError

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(
        execute({
          schema: new GraphQLSchema({
            query: new GraphQLObjectType({
              name: 'Query',
              fields: {
                test: {
                  type: new GraphQLNonNull(GraphQLString),
                  resolve() {
                    resolverError = new Error('Unexposed message.')
                    throw resolverError
                  }
                }
              }
            })
          })
        })
      )
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, {
        body: JSON.stringify({ query: '{ test }' })
      })

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'Error')
      strictEqual(koaError.message, 'GraphQL errors.')
      strictEqual(koaError.status, 200)
      strictEqual(koaError.expose, true)
      strictEqual(Array.isArray(koaError.graphqlErrors), true)
      strictEqual(koaError.graphqlErrors.length, 1)
      strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
      strictEqual(koaError.graphqlErrors[0].message, 'Unexposed message.')
      deepStrictEqual(koaError.graphqlErrors[0].locations, [
        { line: 1, column: 3 }
      ])
      deepStrictEqual(koaError.graphqlErrors[0].path, ['test'])
      deepStrictEqual(koaError.graphqlErrors[0].originalError, resolverError)
      strictEqual(response.status, 200)
      deepStrictEqual(await response.json(), {
        errors: [
          {
            message: 'Internal Server Error',
            locations: [{ line: 1, column: 3 }],
            path: ['test']
          }
        ]
      })
    } finally {
      close()
    }
  })

  tests.add('GraphQL resolver error exposed.', async () => {
    let koaError
    let resolverError

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(
        execute({
          schema: new GraphQLSchema({
            query: new GraphQLObjectType({
              name: 'Query',
              fields: {
                test: {
                  type: new GraphQLNonNull(GraphQLString),
                  resolve() {
                    resolverError = new Error('Exposed message.')
                    resolverError.expose = true
                    throw resolverError
                  }
                }
              }
            })
          })
        })
      )
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port, {
        body: JSON.stringify({ query: '{ test}' })
      })

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'Error')
      strictEqual(koaError.message, 'GraphQL errors.')
      strictEqual(koaError.status, 200)
      strictEqual(koaError.expose, true)
      strictEqual(Array.isArray(koaError.graphqlErrors), true)
      strictEqual(koaError.graphqlErrors.length, 1)
      strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
      strictEqual(koaError.graphqlErrors[0].message, 'Exposed message.')
      deepStrictEqual(koaError.graphqlErrors[0].locations, [
        { line: 1, column: 3 }
      ])
      deepStrictEqual(koaError.graphqlErrors[0].path, ['test'])
      deepStrictEqual(koaError.graphqlErrors[0].originalError, resolverError)
      strictEqual(response.status, 200)
      deepStrictEqual(await response.json(), {
        errors: [
          {
            message: 'Exposed message.',
            locations: [{ line: 1, column: 3 }],
            path: ['test']
          }
        ]
      })
    } finally {
      close()
    }
  })
}
