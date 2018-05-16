import t from 'tap'
import Koa from 'koa'
import fetch from 'node-fetch'
import { GraphQLSchema } from 'graphql'
import {
  graphqlHTTP,
  OptionsTypeError,
  SchemaTypeError,
  SchemaValidationError
} from '.'

const startServer = app =>
  new Promise((resolve, reject) => {
    app.listen(function(error) {
      if (error) reject(error)
      else resolve({ server: this, port: this.address().port })
    })
  })

const testFetch = port =>
  fetch(`http://localhost:${port}`, {
    method: 'POST',
    body: '{ test }'
  })

t.test('Middleware options missing.', async t => {
  t.plan(2)

  const app = new Koa()
    .on('error', error =>
      t.type(error, OptionsTypeError, 'Middleware throws a OptionsTypeError.')
    )
    .use(graphqlHTTP())

  const { server, port } = await startServer(app)
  const { status } = await testFetch(port)

  t.equal(status, 500, 'Middleware sets a 500 HTTP status response.')

  server.close()
})

t.test('Middleware options invalid.', async t => {
  t.plan(2)

  const app = new Koa()
    .on('error', error =>
      t.type(error, OptionsTypeError, 'Middleware throws a OptionsTypeError.')
    )
    .use(graphqlHTTP(false))

  const { server, port } = await startServer(app)
  const { status } = await testFetch(port)

  t.equal(status, 500, 'Middleware sets a 500 HTTP status response.')

  server.close()
})

t.test('Middleware options.schema invalid type.', async t => {
  t.plan(2)

  const app = new Koa()
    .on('error', error =>
      t.type(
        error,
        SchemaTypeError,
        'Middleware throws a SchemaTypeError if options.schema is not a GraphQLSchema instance.'
      )
    )
    .use(graphqlHTTP({ schema: false }))

  const { server, port } = await startServer(app)
  const { status } = await testFetch(port)

  t.equal(status, 500, 'Middleware sets a 500 HTTP status response.')

  server.close()
})

t.test('Middleware options.schema invalid GraphQL.', async t => {
  t.plan(2)

  const app = new Koa()
    .on('error', error =>
      t.type(
        error,
        SchemaValidationError,
        'Middleware throws a SchemaValidationError if options.schema is not a valid GraphQLSchema instance.'
      )
    )
    .use(graphqlHTTP({ schema: new GraphQLSchema({}) }))

  const { server, port } = await startServer(app)
  const { status } = await testFetch(port)

  t.equal(status, 500, 'Middleware sets a 500 HTTP status response.')

  server.close()
})
