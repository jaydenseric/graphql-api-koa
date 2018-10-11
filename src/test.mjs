import {
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import fetch from 'node-fetch'
import t from 'tap'
import { createHttpError } from './createHttpError'
import { errorHandler, execute } from '.'

/**
 * Asynchronously starts a given Koa app server that automatically closes when
 * the given test tears down.
 * @kind function
 * @name startServer
 * @param {Test} t Tap test.
 * @param {Object} app Koa app.
 * @returns {Promise<number>} The port the server is listening on.
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
 * @kind function
 * @name testFetch
 * @param {number} port API URL port.
 * @param {Object} options Fetch options.
 * @returns {Promise<Response>} Fetch response.
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
  t.plan(7)

  const app = new Koa()
    .use(errorHandler())
    .use(() => {
      throw new Error('Test.')
    })
    .on('error', ({ name, message, status, statusCode, expose }) => {
      t.equals(name, 'Error', 'Error name.')
      t.equals(message, 'Test.', 'Error message.')
      t.equals(status, 500, 'Error status.')
      t.equals(statusCode, 500, 'Error statusCode.')
      t.equals(expose, false, 'Error expose.')
    })

  const port = await startServer(t, app)
  const response = await testFetch(port)

  t.equal(response.status, 500, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('`errorHandler` middleware handles a HTTP error.', async t => {
  t.plan(7)

  const app = new Koa()
    .use(errorHandler())
    .use(() => {
      throw createHttpError(403, 'Test.')
    })
    .on('error', ({ name, message, status, statusCode, expose }) => {
      t.equals(name, 'ForbiddenError', 'Error name.')
      t.equals(message, 'Test.', 'Error message.')
      t.equals(status, 403, 'Error status.')
      t.equals(statusCode, 403, 'Error statusCode.')
      t.equals(expose, true, 'Error expose.')
    })

  const port = await startServer(t, app)
  const response = await testFetch(port)

  t.equal(response.status, 403, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('`execute` middleware options missing.', t => {
  try {
    execute()
    t.fail('Expected an error.')
  } catch ({ name, message, status, statusCode, expose }) {
    t.equals(name, 'InternalServerError', 'Error name.')
    t.equals(
      message,
      'GraphQL execute middleware options missing.',
      'Error message.'
    )
    t.equals(status, 500, 'Error status.')
    t.equals(statusCode, 500, 'Error statusCode.')
    t.equals(expose, false, 'Error expose.')
  }

  t.end()
})

t.test('`execute` middleware options not an object.', t => {
  try {
    execute(true)
    t.fail('Expected an error.')
  } catch ({ name, message, status, statusCode, expose }) {
    t.equals(name, 'InternalServerError', 'Error name.')
    t.equals(
      message,
      'GraphQL execute middleware options must be an object.',
      'Error message.'
    )
    t.equals(status, 500, 'Error status.')
    t.equals(statusCode, 500, 'Error statusCode.')
    t.equals(expose, false, 'Error expose.')
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
  } catch ({ name, message, status, statusCode, expose }) {
    t.equals(name, 'InternalServerError', 'Error name.')
    t.equals(
      message,
      'GraphQL execute middleware options invalid: `invalid1`, `invalid2`.',
      'Error message.'
    )
    t.equals(status, 500, 'Error status.')
    t.equals(statusCode, 500, 'Error statusCode.')
    t.equals(expose, false, 'Error expose.')
  }

  t.end()
})

t.test('`execute` middleware option `override` options invalid.', async t => {
  t.plan(7)

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
    .on('error', ({ name, message, status, statusCode, expose }) => {
      t.equals(name, 'InternalServerError', 'Error name.')
      t.equals(
        message,
        'GraphQL execute middleware `override` option return options invalid: `invalid`, `override`.',
        'Error message.'
      )
      t.equals(status, 500, 'Error status.')
      t.equals(statusCode, 500, 'Error statusCode.')
      t.equals(expose, false, 'Error expose.')
    })

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
  } catch ({ name, message, status, statusCode, expose }) {
    t.equals(name, 'InternalServerError', 'Error name.')
    t.equals(
      message,
      'GraphQL execute middleware `override` option must be a function.',
      'Error message.'
    )
    t.equals(status, 500, 'Error status.')
    t.equals(statusCode, 500, 'Error statusCode.')
    t.equals(expose, false, 'Error expose.')
  }

  t.end()
})

t.test('`execute` middleware option `override` not an object.', async t => {
  t.plan(7)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(
      execute({
        schema,
        override: () => true
      })
    )
    .on('error', ({ name, message, status, statusCode, expose }) => {
      t.equals(name, 'InternalServerError', 'Error name.')
      t.equals(
        message,
        'GraphQL execute middleware options must be an object, or an object promise.',
        'Error message.'
      )
      t.equals(status, 500, 'Error status.')
      t.equals(statusCode, 500, 'Error statusCode.')
      t.equals(expose, false, 'Error expose.')
    })

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
    } catch ({ name, message, status, statusCode, expose }) {
      t.equals(name, 'InternalServerError', 'Error name.')
      t.equals(
        message,
        'GraphQL schema is required and must be a `GraphQLSchema` instance.',
        'Error message.'
      )
      t.equals(status, 500, 'Error status.')
      t.equals(statusCode, 500, 'Error statusCode.')
      t.equals(expose, false, 'Error expose.')
    }

    t.end()
  }
)

t.test(
  '`execute` middleware option `schema` not a GraphQLSchema instance override.',
  async t => {
    t.plan(7)

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
      .on('error', ({ name, message, status, statusCode, expose }) => {
        t.equals(name, 'InternalServerError', 'Error name.')
        t.equals(
          message,
          'GraphQL schema is required and must be a `GraphQLSchema` instance.',
          'Error message.'
        )
        t.equals(status, 500, 'Error status.')
        t.equals(statusCode, 500, 'Error statusCode.')
        t.equals(expose, false, 'Error expose.')
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
  try {
    execute({
      schema: new GraphQLSchema({})
    })
    t.fail('Expected an error.')
  } catch ({ name, message, status, statusCode, expose, graphqlErrors }) {
    t.equals(name, 'InternalServerError', 'Error name.')
    t.equals(message, 'GraphQL schema validation errors.', 'Error message.')
    t.equals(status, 500, 'Error status.')
    t.equals(statusCode, 500, 'Error statusCode.')
    t.equals(expose, false, 'Error expose.')
    if (t.equals(Array.isArray(graphqlErrors), true, 'Error graphqlErrors.')) {
      t.equals(graphqlErrors.length, 1, 'Error graphqlErrors length.')
      t.equals(
        graphqlErrors[0].name,
        'GraphQLError',
        'Error graphqlErrors first error name.'
      )
      t.equals(
        graphqlErrors[0].message,
        'Query root type must be provided.',
        'Error graphqlErrors first error message.'
      )
    }
  }

  t.end()
})

t.test(
  '`execute` middleware option `schema` invalid GraphQL override.',
  async t => {
    t.plan(7)

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
      .on('error', ({ name, message, status, statusCode, expose }) => {
        t.equals(name, 'InternalServerError', 'Error name.')
        t.equals(message, 'GraphQL schema validation errors.', 'Error message.')
        t.equals(status, 500, 'Error status.')
        t.equals(statusCode, 500, 'Error statusCode.')
        t.equals(expose, false, 'Error expose.')
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
    t.plan(7)

    const app = new Koa()
      .use(errorHandler())
      .use(execute({ schema }))
      .on('error', ({ name, message, status, statusCode, expose }) => {
        t.equals(name, 'InternalServerError', 'Error name.')
        t.equals(message, 'Request body missing.', 'Error message.')
        t.equals(status, 500, 'Error status.')
        t.equals(statusCode, 500, 'Error statusCode.')
        t.equals(expose, false, 'Error expose.')
      })

    const port = await startServer(t, app)
    const response = await testFetch(port)

    t.equal(response.status, 500, 'Response status.')
    t.matchSnapshot(await response.text(), 'Response body.')
  }
)

t.test('Request body invalid.', async t => {
  t.plan(7)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on('error', ({ name, message, status, statusCode, expose }) => {
      t.equals(name, 'BadRequestError', 'Error name.')
      t.equals(message, 'Request body must be a JSON object.', 'Error message.')
      t.equals(status, 400, 'Error status.')
      t.equals(statusCode, 400, 'Error statusCode.')
      t.equals(expose, true, 'Error expose.')
    })

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: '[]'
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('Operation field `query` missing.', async t => {
  t.plan(7)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on('error', ({ name, message, status, statusCode, expose }) => {
      t.equals(name, 'BadRequestError', 'Error name.')
      t.equals(
        message,
        'GraphQL operation field `query` missing.',
        'Error message.'
      )
      t.equals(status, 400, 'Error status.')
      t.equals(statusCode, 400, 'Error statusCode.')
      t.equals(expose, true, 'Error expose.')
    })

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: '{}'
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test('Operation field `query` invalid.', async t => {
  t.plan(7)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on('error', ({ name, message, status, statusCode, expose }) => {
      t.equals(name, 'BadRequestError', 'Error name.')
      t.equals(
        message,
        'GraphQL query syntax error: Syntax Error: Unexpected [',
        'Error message.'
      )
      t.equals(status, 400, 'Error status.')
      t.equals(statusCode, 400, 'Error statusCode.')
      t.equals(expose, true, 'Error expose.')
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
  t.plan(7)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on('error', ({ name, message, status, statusCode, expose }) => {
      t.equals(name, 'BadRequestError', 'Error name.')
      t.equals(
        message,
        'GraphQL operation field invalid: Variables must be provided as an Object where each property is a variable value. Perhaps look to see if an unparsed JSON string was provided.',
        'Error message.'
      )
      t.equals(status, 400, 'Error status.')
      t.equals(statusCode, 400, 'Error statusCode.')
      t.equals(expose, true, 'Error expose.')
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
  t.plan(15)

  const app = new Koa()
    .use(errorHandler())
    .use(bodyParser())
    .use(execute({ schema }))
    .on(
      'error',
      ({ name, message, status, statusCode, expose, graphqlErrors }) => {
        t.equals(name, 'BadRequestError', 'Error name.')
        t.equals(message, 'GraphQL query validation errors.', 'Error message.')
        t.equals(status, 400, 'Error status.')
        t.equals(statusCode, 400, 'Error statusCode.')
        t.equals(expose, true, 'Error expose.')
        if (
          t.equals(Array.isArray(graphqlErrors), true, 'Error graphqlErrors.')
        ) {
          t.equals(graphqlErrors.length, 2, 'Error graphqlErrors length.')
          t.equals(
            graphqlErrors[0].name,
            'GraphQLError',
            'Error graphqlErrors first error name.'
          )
          t.equals(
            graphqlErrors[0].message,
            'Cannot query field "wrongOne" on type "Query".',
            'Error graphqlErrors first error message.'
          )
          t.same(
            graphqlErrors[0].locations,
            [
              {
                line: 1,
                column: 9
              }
            ],
            'Error graphqlErrors first error locations.'
          )
          t.equals(
            graphqlErrors[1].name,
            'GraphQLError',
            'Error graphqlErrors second error name.'
          )
          t.equals(
            graphqlErrors[1].message,
            'Cannot query field "wrongTwo" on type "Query".',
            'Error graphqlErrors second error message.'
          )
          t.same(
            graphqlErrors[1].locations,
            [
              {
                line: 1,
                column: 19
              }
            ],
            'Error graphqlErrors first error locations.'
          )
        }
      }
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
  t.plan(12)

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
    .on(
      'error',
      ({ name, message, status, statusCode, expose, graphqlErrors }) => {
        t.equals(name, 'Error', 'Error name.')
        t.equals(message, 'GraphQL errors.', 'Error message.')
        t.equals(status, 200, 'Error status.')
        t.equals(statusCode, 200, 'Error statusCode.')
        t.equals(expose, true, 'Error expose.')
        if (
          t.equals(Array.isArray(graphqlErrors), true, 'Error graphqlErrors.')
        ) {
          t.equals(graphqlErrors.length, 1, 'Error graphqlErrors length.')
          t.equals(
            graphqlErrors[0].name,
            'GraphQLError',
            'Error graphqlErrors first error name.'
          )
          t.equals(
            graphqlErrors[0].message,
            'Resolver error.',
            'Error graphqlErrors first error message.'
          )
          t.same(
            graphqlErrors[0].locations,
            [
              {
                line: 1,
                column: 3
              }
            ],
            'Error graphqlErrors first error locations.'
          )
        }
      }
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
