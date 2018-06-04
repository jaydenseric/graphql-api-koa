import t from 'tap'
import Koa from 'koa'
import fetch from 'node-fetch'
import {
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import { LABELS, errorHandler, execute, graphqlPreset } from '.'

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
 * Creates a stack removed version of an error suitable for a snapshot.
 * @param {Object} error An error.
 * @returns {Object} Object to snapshot.
 * @ignore
 */
const errorSnapshot = error => {
  const {
    // eslint-disable-next-line no-unused-vars
    stack,
    ...stackless
  } = error

  if ('status' in error) stackless.status = error.status
  if ('expose' in error) stackless.expose = error.expose

  if (Array.isArray(stackless.graphqlErrors))
    stackless.graphqlErrors = stackless.graphqlErrors.map(errorSnapshot)

  return stackless
}

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

t.test(
  `${LABELS.execute} options missing.`,
  // eslint-disable-next-line require-await
  async t => {
    try {
      graphqlPreset()
      t.fail('Expected an error.')
    } catch (error) {
      t.matchSnapshot(errorSnapshot(error), 'Creation error.')
    }
  }
)

t.test(
  `${LABELS.execute} options not an object.`,
  // eslint-disable-next-line require-await
  async t => {
    try {
      graphqlPreset({ executeOptions: true })
      t.fail('Expected an error.')
    } catch (error) {
      t.matchSnapshot(errorSnapshot(error), 'Creation error.')
    }
  }
)

t.test(
  `${LABELS.execute} option \`override\` not a function.`,
  // eslint-disable-next-line require-await
  async t => {
    try {
      graphqlPreset({
        executeOptions: {
          schema,
          override: true
        }
      })

      t.fail('Expected an error.')
    } catch (error) {
      t.matchSnapshot(errorSnapshot(error), 'Creation error.')
    }
  }
)

t.test(`${LABELS.execute} option \`override\` not an object.`, async t => {
  t.plan(3)

  const app = new Koa()
    .use(
      graphqlPreset({
        executeOptions: {
          schema,
          override:
            // eslint-disable-next-line require-await
            async () => true
        }
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
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test(`${LABELS.execute} option \`rootValue\`.`, async t => {
  const app = new Koa().use(
    graphqlPreset({
      executeOptions: {
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
      }
    })
  )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test(
  `${LABELS.execute} option \`rootValue\` override using Koa ctx.`,
  async t => {
    const app = new Koa()
      .use(async (ctx, next) => {
        ctx.state.test = 'rootValueOverridden'
        await next()
      })
      .use(
        graphqlPreset({
          executeOptions: {
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
            override:
              // eslint-disable-next-line require-await
              async ctx => ({
                rootValue: ctx.state.test
              })
          }
        })
      )

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 200, 'Response status.')
    t.matchSnapshot(await response.json(), 'Response body.')
  }
)

t.test(`${LABELS.execute} option \`contextValue\`.`, async t => {
  const app = new Koa().use(
    graphqlPreset({
      executeOptions: {
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
      }
    })
  )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test(
  `${LABELS.execute} option \`contextValue\` override using Koa ctx.`,
  async t => {
    const app = new Koa()
      .use(async (ctx, next) => {
        ctx.state.test = 'contextValueOverridden'
        await next()
      })
      .use(
        graphqlPreset({
          executeOptions: {
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
          }
        })
      )

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 200, 'Response status.')
    t.matchSnapshot(await response.json(), 'Response body.')
  }
)

t.test(`${LABELS.execute} option \`fieldResolver\`.`, async t => {
  const app = new Koa().use(
    graphqlPreset({
      executeOptions: {
        schema,
        fieldResolver: () => `fieldResolver`
      }
    })
  )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ test }'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test(
  `${LABELS.execute} option \`fieldResolver\` override using Koa ctx.`,
  async t => {
    const app = new Koa()
      .use(async (ctx, next) => {
        ctx.state.test = 'fieldResolverOverridden'
        await next()
      })
      .use(
        graphqlPreset({
          executeOptions: {
            schema,
            fieldResolver: () => `fieldResolver`,
            override:
              // eslint-disable-next-line require-await
              async ctx => ({
                fieldResolver: () => ctx.state.test
              })
          }
        })
      )

    const port = await startServer(t, app)
    const response = await testFetch(port, {
      body: JSON.stringify({
        query: '{ test }'
      })
    })

    t.equal(response.status, 200, 'Response status.')
    t.matchSnapshot(await response.json(), 'Response body.')
  }
)

t.test(
  `${LABELS.execute} option \`schema\` not a GraphQLSchema instance.`,
  // eslint-disable-next-line require-await
  async t => {
    try {
      graphqlPreset({
        executeOptions: {
          schema: true
        }
      })
      t.fail('Expected an error.')
    } catch (error) {
      t.matchSnapshot(errorSnapshot(error), 'Creation error.')
    }
  }
)

t.test(
  `${LABELS.execute} option \`schema\` override not a GraphQLSchema instance.`,
  async t => {
    t.plan(3)

    const app = new Koa()
      .use(
        graphqlPreset({
          executeOptions: {
            schema,
            override: () => ({
              schema: true
            })
          }
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
    t.matchSnapshot(await response.json(), 'Response body.')
  }
)

t.test(
  `${LABELS.execute} option \`schema\` GraphQL invalid.`,
  // eslint-disable-next-line require-await
  async t => {
    try {
      graphqlPreset({
        executeOptions: {
          schema: new GraphQLSchema({})
        }
      })
      t.fail('Expected an error.')
    } catch (error) {
      t.matchSnapshot(errorSnapshot(error), 'Creation error.')
    }
  }
)

t.test(
  `${LABELS.execute} option \`schema\` override GraphQL invalid.`,
  async t => {
    t.plan(3)

    const app = new Koa()
      .use(
        graphqlPreset({
          executeOptions: {
            schema,
            override: () => ({
              schema: new GraphQLSchema({})
            })
          }
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
    t.matchSnapshot(await response.json(), 'Response body.')
  }
)

t.test(
  'Request body missing due to absent body parser middleware.',
  async t => {
    t.plan(3)

    const app = new Koa()
      .use(errorHandler())
      .use(
        execute({
          executeOptions: {
            schema
          }
        })
      )
      .on('error', error =>
        t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
      )

    const port = await startServer(t, app)
    const response = await testFetch(port)

    t.equal(response.status, 500, 'Response status.')
    t.matchSnapshot(await response.json(), 'Response body.')
  }
)

t.test('Request body invalid.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(
      graphqlPreset({
        executeOptions: {
          schema
        }
      })
    )
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: '[]'
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('GraphQL operation field `query` missing.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(
      graphqlPreset({
        executeOptions: {
          schema
        }
      })
    )
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: '{}'
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('GraphQL operation field `query` invalid.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(
      graphqlPreset({
        executeOptions: {
          schema
        }
      })
    )
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
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('GraphQL operation field `variables` invalid.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(
      graphqlPreset({
        executeOptions: {
          schema
        }
      })
    )
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
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('GraphQL operation field `query` validation errors.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(
      graphqlPreset({
        executeOptions: {
          schema
        }
      })
    )
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
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('GraphQL resolver error.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(
      graphqlPreset({
        executeOptions: {
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
        }
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
  t.matchSnapshot(await response.json(), 'Response body.')
})
