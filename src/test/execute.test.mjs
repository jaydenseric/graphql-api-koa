import assert from 'assert'
import {
  GraphQLError,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { errorHandler } from '../errorHandler.mjs'
import { execute } from '../execute.mjs'
import { fetchJsonAtPort } from './fetchJsonAtPort.mjs'
import { startServer } from './startServer.mjs'

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

export default tests => {
  tests.add('`execute` middleware options missing.', () => {
    assert.throws(() => execute(), {
      name: 'InternalServerError',
      message: 'GraphQL execute middleware options missing.',
      status: 500,
      expose: false
    })
  })

  tests.add('`execute` middleware options not an object.', () => {
    assert.throws(() => execute(true), {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware options must be an enumerable object.',
      status: 500,
      expose: false
    })
  })

  tests.add('`execute` middleware options invalid.', () => {
    assert.throws(() => execute({ schema, invalid1: true, invalid2: true }), {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware options invalid: `invalid1`, `invalid2`.',
      status: 500,
      expose: false
    })
  })

  tests.add('`execute` middleware option `override` not a function.', () => {
    assert.throws(() => execute({ schema, override: true }), {
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

        assert.ok(koaError instanceof Error)
        assert.strictEqual(koaError.name, 'InternalServerError')
        assert.strictEqual(
          koaError.message,
          'GraphQL execute middleware `override` option resolved options must be an enumerable object.'
        )
        assert.strictEqual(koaError.status, 500)
        assert.strictEqual(koaError.expose, false)
        assert.strictEqual(response.status, 500)
        assert.deepStrictEqual(await response.json(), {
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

        assert.ok(koaError instanceof Error)
        assert.strictEqual(koaError.name, 'InternalServerError')
        assert.strictEqual(
          koaError.message,
          'GraphQL execute middleware `override` option resolved options invalid: `invalid`, `override`.'
        )
        assert.strictEqual(koaError.status, 500)
        assert.strictEqual(koaError.expose, false)
        assert.strictEqual(response.status, 500)
        assert.deepStrictEqual(await response.json(), {
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

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'BadRequestError')
      assert.strictEqual(koaError.message, 'GraphQL query validation errors.')
      assert.strictEqual(koaError.status, 400)
      assert.strictEqual(koaError.expose, true)
      assert.strictEqual(Array.isArray(koaError.graphqlErrors), true)
      assert.strictEqual(koaError.graphqlErrors.length, 2)
      assert.strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
      assert.strictEqual(koaError.graphqlErrors[0].message, error1.message)
      assert.deepStrictEqual(
        koaError.graphqlErrors[0].locations,
        error1.locations
      )
      assert.strictEqual(koaError.graphqlErrors[1].name, 'GraphQLError')
      assert.strictEqual(koaError.graphqlErrors[1].message, error2.message)
      assert.deepStrictEqual(
        koaError.graphqlErrors[1].locations,
        error2.locations
      )
      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(await response.json(), {
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

        assert.ok(koaError instanceof Error)
        assert.strictEqual(koaError.name, 'BadRequestError')
        assert.strictEqual(koaError.message, 'GraphQL query validation errors.')
        assert.strictEqual(koaError.status, 400)
        assert.strictEqual(koaError.expose, true)
        assert.strictEqual(Array.isArray(koaError.graphqlErrors), true)
        assert.strictEqual(koaError.graphqlErrors.length, 2)
        assert.strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
        assert.strictEqual(koaError.graphqlErrors[0].message, error1.message)
        assert.deepStrictEqual(
          koaError.graphqlErrors[0].locations,
          error1.locations
        )
        assert.strictEqual(koaError.graphqlErrors[1].name, 'GraphQLError')
        assert.strictEqual(koaError.graphqlErrors[1].message, error2.message)
        assert.deepStrictEqual(
          koaError.graphqlErrors[1].locations,
          error2.locations
        )
        assert.strictEqual(response.status, 400)
        assert.deepStrictEqual(await response.json(), {
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

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(await response.json(), {
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

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(await response.json(), {
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

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(await response.json(), {
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

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(await response.json(), {
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

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(await response.json(), {
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

      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(await response.json(), {
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

        assert.strictEqual(response.status, 200)
        assert.deepStrictEqual(await response.json(), {
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
      assert.throws(() => execute({ schema: true }), {
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

        assert.ok(koaError instanceof Error)
        assert.strictEqual(koaError.name, 'InternalServerError')
        assert.strictEqual(
          koaError.message,
          'GraphQL execute middleware requires a GraphQL schema.'
        )
        assert.strictEqual(koaError.status, 500)
        assert.strictEqual(koaError.expose, false)
        assert.strictEqual(response.status, 500)
        assert.deepStrictEqual(await response.json(), {
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

        assert.ok(koaError instanceof Error)
        assert.strictEqual(koaError.name, 'InternalServerError')
        assert.strictEqual(
          koaError.message,
          'GraphQL execute middleware `override` option resolved `schema` option GraphQL schema must be a `GraphQLSchema` instance.'
        )
        assert.strictEqual(koaError.status, 500)
        assert.strictEqual(koaError.expose, false)
        assert.strictEqual(response.status, 500)
        assert.deepStrictEqual(await response.json(), {
          errors: [{ message: 'Internal Server Error' }]
        })
      } finally {
        close()
      }
    }
  )

  tests.add('`execute` middleware option `schema` invalid GraphQL.', () => {
    assert.throws(() => execute({ schema: new GraphQLSchema({}) }), {
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

        assert.ok(koaError instanceof Error)
        assert.strictEqual(koaError.name, 'InternalServerError')
        assert.strictEqual(
          koaError.message,
          'GraphQL execute middleware `override` option resolved `schema` option has GraphQL schema validation errors.'
        )
        assert.strictEqual(koaError.status, 500)
        assert.strictEqual(koaError.expose, false)
        assert.strictEqual(Array.isArray(koaError.graphqlErrors), true)
        assert.strictEqual(koaError.graphqlErrors.length, 1)
        assert.strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
        assert.strictEqual(
          koaError.graphqlErrors[0].message,
          'Query root type must be provided.'
        )
        assert.strictEqual(response.status, 500)
        assert.deepStrictEqual(await response.json(), {
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

        assert.ok(koaError instanceof Error)
        assert.strictEqual(koaError.name, 'InternalServerError')
        assert.strictEqual(koaError.message, 'Request body missing.')
        assert.strictEqual(koaError.status, 500)
        assert.strictEqual(koaError.expose, false)
        assert.strictEqual(response.status, 500)
        assert.deepStrictEqual(await response.json(), {
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

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'BadRequestError')
      assert.strictEqual(koaError.message, errorMessage)
      assert.strictEqual(koaError.status, 400)
      assert.strictEqual(koaError.expose, true)
      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(await response.json(), {
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

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'BadRequestError')
      assert.strictEqual(koaError.message, errorMessage)
      assert.strictEqual(koaError.status, 400)
      assert.strictEqual(koaError.expose, true)
      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(await response.json(), {
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

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'BadRequestError')
      assert.strictEqual(koaError.message, errorMessage)
      assert.strictEqual(koaError.status, 400)
      assert.strictEqual(koaError.expose, true)
      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(await response.json(), {
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

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'BadRequestError')
      assert.strictEqual(koaError.message, errorMessage)
      assert.strictEqual(koaError.status, 400)
      assert.strictEqual(koaError.expose, true)
      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(await response.json(), {
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

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'BadRequestError')
      assert.strictEqual(koaError.message, 'GraphQL query validation errors.')
      assert.strictEqual(koaError.status, 400)
      assert.strictEqual(koaError.expose, true)
      assert.strictEqual(Array.isArray(koaError.graphqlErrors), true)
      assert.strictEqual(koaError.graphqlErrors.length, 2)
      assert.strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
      assert.strictEqual(koaError.graphqlErrors[0].message, error1.message)
      assert.deepStrictEqual(
        koaError.graphqlErrors[0].locations,
        error1.locations
      )
      assert.strictEqual(koaError.graphqlErrors[1].name, 'GraphQLError')
      assert.strictEqual(koaError.graphqlErrors[1].message, error2.message)
      assert.deepStrictEqual(
        koaError.graphqlErrors[1].locations,
        error2.locations
      )
      assert.strictEqual(response.status, 400)
      assert.deepStrictEqual(await response.json(), {
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

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'Error')
      assert.strictEqual(koaError.message, 'GraphQL errors.')
      assert.strictEqual(koaError.status, 200)
      assert.strictEqual(koaError.expose, true)
      assert.strictEqual(Array.isArray(koaError.graphqlErrors), true)
      assert.strictEqual(koaError.graphqlErrors.length, 1)
      assert.strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
      assert.strictEqual(
        koaError.graphqlErrors[0].message,
        'Unexposed message.'
      )
      assert.deepStrictEqual(koaError.graphqlErrors[0].locations, [
        { line: 1, column: 3 }
      ])
      assert.deepStrictEqual(koaError.graphqlErrors[0].path, ['test'])
      assert.deepStrictEqual(
        koaError.graphqlErrors[0].originalError,
        resolverError
      )
      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(await response.json(), {
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

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'Error')
      assert.strictEqual(koaError.message, 'GraphQL errors.')
      assert.strictEqual(koaError.status, 200)
      assert.strictEqual(koaError.expose, true)
      assert.strictEqual(Array.isArray(koaError.graphqlErrors), true)
      assert.strictEqual(koaError.graphqlErrors.length, 1)
      assert.strictEqual(koaError.graphqlErrors[0].name, 'GraphQLError')
      assert.strictEqual(koaError.graphqlErrors[0].message, 'Exposed message.')
      assert.deepStrictEqual(koaError.graphqlErrors[0].locations, [
        { line: 1, column: 3 }
      ])
      assert.deepStrictEqual(koaError.graphqlErrors[0].path, ['test'])
      assert.deepStrictEqual(
        koaError.graphqlErrors[0].originalError,
        resolverError
      )
      assert.strictEqual(response.status, 200)
      assert.deepStrictEqual(await response.json(), {
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
