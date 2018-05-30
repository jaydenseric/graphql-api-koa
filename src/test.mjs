import t from 'tap'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import fetch from 'node-fetch'
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean
} from 'graphql'
import { errorHandler, execute, graphqlPreset } from '.'

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      ok: {
        type: GraphQLBoolean,
        resolve: () => true
      },
      throws: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve() {
          throw new Error('Resolver error.')
        }
      }
    }
  })
})

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

t.test('Execute middleware options as a function.', async t => {
  t.plan(3)

  const app = new Koa().use(bodyParser()).use(
    execute(ctx => {
      t.ok(
        typeof ctx === 'object' && 'request' in ctx && 'response' in ctx,
        'Function receives a Koa context object.'
      )

      return { schema }
    })
  )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ ok }'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('Execute middleware options missing.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(graphqlPreset())
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port)

  t.equal(response.status, 500, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('Execute middleware options invalid.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(graphqlPreset({ executeOptions: false }))
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port)

  t.equal(response.status, 500, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('Execute middleware options.schema invalid type.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(graphqlPreset({ executeOptions: { schema: false } }))
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port)

  t.equal(response.status, 500, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('Execute middleware options.schema invalid GraphQL.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(graphqlPreset({ executeOptions: { schema: new GraphQLSchema({}) } }))
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port)

  t.equal(response.status, 500, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test(
  'Request body missing due to absent body parser middleware.',
  async t => {
    t.plan(3)

    const app = new Koa()
      .use(errorHandler())
      .use(execute({ executeOptions: { schema } }))
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
    .use(graphqlPreset({ executeOptions: { schema } }))
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
    .use(graphqlPreset({ executeOptions: { schema } }))
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
    .use(graphqlPreset({ executeOptions: { schema } }))
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
    .use(graphqlPreset({ executeOptions: { schema } }))
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ ok }',
      variables: '[]'
    })
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('GraphQL operation field `query` validation errors.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(graphqlPreset({ executeOptions: { schema } }))
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ ok, wrongOne, wrongTwo }'
    })
  })

  t.equal(response.status, 400, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})

t.test('GraphQL resolver error.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(graphqlPreset({ executeOptions: { schema } }))
    .on('error', error =>
      t.matchSnapshot(errorSnapshot(error), 'Koa app error event.')
    )

  const port = await startServer(t, app)
  const response = await testFetch(port, {
    body: JSON.stringify({
      query: '{ throws }'
    })
  })

  t.equal(response.status, 200, 'Response status.')
  t.matchSnapshot(await response.json(), 'Response body.')
})
