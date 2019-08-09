import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import t from 'tap'
import { startServer } from './test-helpers/startServer'
import { testFetch } from './test-helpers/testFetch'
import { errorHandler, execute } from '.'

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

t.test('`execute` middleware options missing.', t => {
  t.throws(
    () => execute(),
    {
      name: 'InternalServerError',
      message: 'GraphQL execute middleware options missing.',
      status: 500,
      statusCode: 500,
      expose: false
    },
    'Creation error.'
  )
  t.end()
})

t.test('`execute` middleware options not an object.', t => {
  t.throws(
    () => execute(true),
    {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware options must be an enumerable object.',
      status: 500,
      statusCode: 500,
      expose: false
    },
    'Creation error.'
  )
  t.end()
})

t.test('`execute` middleware options invalid.', t => {
  t.throws(
    () => execute({ schema, invalid1: true, invalid2: true }),
    {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware options invalid: `invalid1`, `invalid2`.',
      status: 500,
      statusCode: 500,
      expose: false
    },
    'Creation error.'
  )
  t.end()
})

t.test('`execute` middleware option `override` not a function.', t => {
  t.throws(
    () => execute({ schema, override: true }),
    {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware `override` option must be a function.',
      status: 500,
      statusCode: 500,
      expose: false
    },
    'Creation error.'
  )
  t.end()
})

t.test(
  '`execute` middleware option `override` returning not an object.',
  async t => {
    t.plan(3)

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
        t.match(
          error,
          {
            name: 'InternalServerError',
            message:
              'GraphQL execute middleware `override` option resolved options must be an enumerable object.',
            status: 500,
            statusCode: 500,
            expose: false
          },
          'Koa app emitted error.'
        )
      })

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 500, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test(
  '`execute` middleware option `override` returning options invalid.',
  async t => {
    t.plan(3)

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
        t.match(
          error,
          {
            name: 'InternalServerError',
            message:
              'GraphQL execute middleware `override` option resolved options invalid: `invalid`, `override`.',
            status: 500,
            statusCode: 500,
            expose: false
          },
          'Koa app emitted error.'
        )
      })

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 500, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test('`execute` middleware option `rootValue`.', async t => {
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

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test(
  '`execute` middleware option `rootValue` override using Koa ctx.',
  async t => {
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
          override: ctx => ({
            rootValue: ctx.state.test
          })
        })
      )

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 200, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test('`execute` middleware option `contextValue`.', async t => {
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

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test(
  '`execute` middleware option `contextValue` override using Koa ctx.',
  async t => {
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

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 200, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test(
  '`execute` middleware option `contextValue` override using Koa ctx async.',
  async t => {
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
          override:
            // eslint-disable-next-line require-await
            async ctx => ({
              contextValue: ctx.state.test
            })
        })
      )

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 200, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test('`execute` middleware option `fieldResolver`.', async t => {
  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(
      execute({
        schema,
        fieldResolver: () => 'fieldResolver'
      })
    )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test(
  '`execute` middleware option `fieldResolver` override using Koa ctx.',
  async t => {
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

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 200, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test(
  '`execute` middleware option `schema` not a GraphQLSchema instance.',
  t => {
    t.throws(
      () => execute({ schema: true }),
      {
        name: 'InternalServerError',
        message:
          'GraphQL execute middleware `schema` option GraphQL schema must be a `GraphQLSchema` instance.',
        status: 500,
        statusCode: 500,
        expose: false
      },
      'Creation error.'
    )
    t.end()
  }
)

t.test(
  '`execute` middleware option `schema` undefined, without an override.',
  async t => {
    t.plan(3)

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(execute({ schema: undefined }))
      .on('error', error => {
        t.match(
          error,
          {
            name: 'InternalServerError',
            message: 'GraphQL execute middleware requires a GraphQL schema.',
            status: 500,
            statusCode: 500,
            expose: false
          },
          'Koa app emitted error.'
        )
      })

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 500, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test(
  '`execute` middleware option `schema` not a GraphQLSchema instance override.',
  async t => {
    t.plan(3)

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(
        execute({
          schema,
          override: () => ({
            schema: true
          })
        })
      )
      .on('error', error => {
        t.match(
          error,
          {
            name: 'InternalServerError',
            message:
              'GraphQL execute middleware `override` option resolved `schema` option GraphQL schema must be a `GraphQLSchema` instance.',
            status: 500,
            statusCode: 500,
            expose: false
          },
          'Koa app emitted error.'
        )
      })

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 500, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test('`execute` middleware option `schema` invalid GraphQL.', t => {
  t.throws(
    () => execute({ schema: new GraphQLSchema({}) }),
    {
      name: 'InternalServerError',
      message:
        'GraphQL execute middleware `schema` option has GraphQL schema validation errors.',
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
    'Creation error.'
  )
  t.end()
})

t.test(
  '`execute` middleware option `schema` invalid GraphQL override.',
  async t => {
    t.plan(3)

    const app = new Koa()
      .use(errorHandler())
      .use(bodyParser())
      .use(
        execute({
          schema,
          override: () => ({
            schema: new GraphQLSchema({})
          })
        })
      )
      .on('error', error => {
        t.match(
          error,
          {
            name: 'InternalServerError',
            message:
              'GraphQL execute middleware `override` option resolved `schema` option has GraphQL schema validation errors.',
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
          'Koa app emitted error.'
        )
      })

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 500, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test(
  'Request body missing due to absent body parser middleware.',
  async t => {
    t.plan(3)

    const app = new Koa()
      .use(errorHandler())
      .use(execute({ schema }))
      .on('error', error => {
        t.match(
          error,
          {
            name: 'InternalServerError',
            message: 'Request body missing.',
            status: 500,
            statusCode: 500,
            expose: false
          },
          'Koa app emitted error.'
        )
      })

    const port = await startServer(t, app)
    const response = await testFetch(port)

    t.equal(response.status, 500, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test('Request body invalid.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on('error', error => {
      t.match(
        error,
        {
          name: 'BadRequestError',
          message: 'Request body must be a JSON object.',
          status: 400,
          statusCode: 400,
          expose: true
        },
        'Koa app emitted error.'
      )
    })

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: '[]'
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('Operation field `query` missing.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on('error', error => {
      t.match(
        error,
        {
          name: 'BadRequestError',
          message: 'GraphQL operation field `query` missing.',
          status: 400,
          statusCode: 400,
          expose: true
        },
        'Koa app emitted error.'
      )
    })

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: '{}'
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('Operation field `query` invalid.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on('error', error => {
      t.match(
        error,
        {
          name: 'BadRequestError',
          message: 'GraphQL query syntax error: Syntax Error: Unexpected [',
          status: 400,
          statusCode: 400,
          expose: true
        },
        'Koa app emitted error.'
      )
    })

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '[]'
    })
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('Operation field `variables` invalid.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on('error', error => {
      t.match(
        error,
        {
          name: 'BadRequestError',
          message:
            'GraphQL operation field invalid: Variables must be provided as an Object where each property is a variable value. Perhaps look to see if an unparsed JSON string was provided.',
          status: 400,
          statusCode: 400,
          expose: true
        },
        'Koa app emitted error.'
      )
    })

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }',
      variables: '[]'
    })
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('Operation field `query` validation errors.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on('error', error => {
      t.match(
        error,
        {
          name: 'BadRequestError',
          message: 'GraphQL query validation errors.',
          status: 400,
          statusCode: 400,
          expose: true,
          graphqlErrors: [
            {
              name: 'GraphQLError',
              message: 'Cannot query field "wrongOne" on type "Query".',
              locations: [{ line: 1, column: 9 }]
            },
            {
              name: 'GraphQLError',
              message: 'Cannot query field "wrongTwo" on type "Query".',
              locations: [{ line: 1, column: 19 }]
            }
          ]
        },
        'Koa app emitted error.'
      )
    })

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test, wrongOne, wrongTwo }'
    })
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('GraphQL resolver error unexposed.', async t => {
  t.plan(3)

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
                  throw new Error('Unexposed message.')
                }
              }
            }
          })
        })
      })
    )
    .on('error', error => {
      t.match(
        error,
        {
          name: 'Error',
          message: 'GraphQL errors.',
          status: 200,
          statusCode: 200,
          expose: true,
          graphqlErrors: [
            {
              name: 'GraphQLError',
              message: 'Unexposed message.',
              locations: [{ line: 1, column: 3 }],
              path: ['test']
            }
          ]
        },
        'Koa app emitted error.'
      )
    })

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test}'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('GraphQL resolver error exposed.', async t => {
  t.plan(3)

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
                  const error = new Error('Exposed message.')
                  error.expose = true
                  throw error
                }
              }
            }
          })
        })
      })
    )
    .on('error', error => {
      t.match(
        error,
        {
          name: 'Error',
          message: 'GraphQL errors.',
          status: 200,
          statusCode: 200,
          expose: true,
          graphqlErrors: [
            {
              name: 'GraphQLError',
              message: 'Exposed message.',
              locations: [{ line: 1, column: 3 }],
              path: ['test']
            }
          ]
        },
        'Koa app emitted error.'
      )
    })

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})
