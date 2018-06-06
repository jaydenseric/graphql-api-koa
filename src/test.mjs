import t from 'tap'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import fetch from 'node-fetch'
import {
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import createError from 'http-errors'
import { errorHandler, execute } from '.'

/**
 * Asynchronously starts a given Koa app server that automatically closes when
 * the given test tears down.
 * @param {module:tap.Test} t Tap test.
 * @param {module:koa} app Koa app.
 * @returns {Promise<module:net.Server>} Node.js server.
 * @ignore
 */
const startServer = (t, app) =>
  new Promise((resolve, reject) => {
    app.listen(function(error) {
      if (error) reject(error)
      else {
        t.tearDown(() => this.close())
        resolve(this.address().port)
      }
    })
  })

/**
 * Makes a fetch request to the test API.
 * @param {number} port API URL port.
 * @param {Object} options Fetch options.
 * @returns {Promise<external:Response>} Fetch response.
 * @ignore
 */
const testFetch = (port, options = {}) =>
  fetch(`http://localhost:${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    ...options
  })

/**
 * Converts an error instance to a snapshot string.
 * @param {Object} error An error.
 * @returns {string} Snapshot string.
 * @ignore
 */
const errorSnapshot = error =>
  `${error.name} ${JSON.stringify(
    error,
    (key, value) => (key === 'trace' ? undefined : value),
    2
  )}`

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

t.test('`errorHandler` middleware handles a standard error.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(errorHandler())
    .use(() => {
      throw new Error('Test.')
    })
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port)

  t.equal(response.status, 500, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('`errorHandler` middleware handles a HTTP error.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(errorHandler())
    .use(() => {
      throw createError(403, 'Test.')
    })
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port)

  t.equal(response.status, 403, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('`execute` middleware options missing.', t => {
  try {
    execute()
    t.fail('Expected an error.')
  } catch (error) {
    t.matchSnapshot(errorSnapshot(error), 'Creation error.')
  }

  t.end()
})

t.test('`execute` middleware options not an object.', t => {
  try {
    execute(true)
    t.fail('Expected an error.')
  } catch (error) {
    t.matchSnapshot(errorSnapshot(error), 'Creation error.')
  }

  t.end()
})

t.test('`execute` middleware options invalid.', t => {
  try {
    execute({
      schema,
      invalid1: true,
      invalid2: true
    })
    t.fail('Expected an error.')
  } catch (error) {
    t.matchSnapshot(errorSnapshot(error), 'Creation error.')
  }

  t.end()
})

t.test('`execute` middleware option `override` options invalid.', async t => {
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
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }'
    })
  })

  t.equal(response.status, 500, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('`execute` middleware option `override` not a function.', t => {
  try {
    execute({
      schema,
      override: true
    })
    t.fail('Expected an error.')
  } catch (error) {
    t.matchSnapshot(errorSnapshot(error), 'Creation error.')
  }

  t.end()
})

t.test('`execute` middleware option `override` not an object.', async t => {
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
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }'
    })
  })

  t.equal(response.status, 500, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

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
    try {
      execute({ schema: true })
      t.fail('Expected an error.')
    } catch (error) {
      t.matchSnapshot(errorSnapshot(error), 'Creation error.')
    }

    t.end()
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
      .on('error', error =>
        t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
      )

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
  try {
    execute({
      schema: new GraphQLSchema({})
    })
    t.fail('Expected an error.')
  } catch (error) {
    t.matchSnapshot(errorSnapshot(error), 'Creation error.')
  }

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
      .on('error', error =>
        t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
      )

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
      .on('error', error =>
        t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
      )

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
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

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
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

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
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

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
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

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
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test, wrongOne, wrongTwo }'
    })
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('GraphQL resolver error.', async t => {
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
                  throw new Error('Resolver error.')
                }
              }
            }
          })
        })
      })
    )
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
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
