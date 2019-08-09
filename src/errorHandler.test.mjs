import Koa from 'koa'
import t from 'tap'
import { createHttpError } from './createHttpError'
import { errorHandler } from './errorHandler'
import { startServer } from './test-helpers/startServer'
import { testFetch } from './test-helpers/testFetch'

t.test('`errorHandler` middleware handles a standard error.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(errorHandler())
    .use(() => {
      throw new Error('Test.')
    })
    .on('error', error => {
      t.match(
        error,
        {
          name: 'Error',
          message: 'Test.',
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
})

t.test('`errorHandler` middleware handles a HTTP error.', async t => {
  t.plan(3)

  const app = new Koa()
    .use(errorHandler())
    .use(() => {
      throw createHttpError(403, 'Test.')
    })
    .on('error', error => {
      t.match(
        error,
        {
          name: 'ForbiddenError',
          message: 'Test.',
          status: 403,
          statusCode: 403,
          expose: true
        },
        'Koa app emitted error.'
      )
    })

  const port = await startServer(t, app)
  const response = await testFetch(port)

  t.equal(response.status, 403, 'Response status.')
  t.matchSnapshot(await response.text(), 'Response body.')
})

t.test(
  '`errorHandler` middleware handles an error after `ctx.response.body` was set.',
  async t => {
    t.plan(3)

    const app = new Koa()
      .use(errorHandler())
      .use(ctx => {
        ctx.response.body = { data: {} }
        throw new Error('Test.')
      })
      .on('error', error => {
        t.match(
          error,
          {
            name: 'Error',
            message: 'Test.',
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
