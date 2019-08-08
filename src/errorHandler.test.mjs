import Koa from 'koa'
import t from 'tap'
import { createHttpError } from './createHttpError'
import { errorHandler } from './errorHandler'
import { startServer } from './test-helpers/startServer'
import { testFetch } from './test-helpers/testFetch'

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

t.test(
  '`errorHandler` middleware handles an error after `ctx.response.body` was set.',
  async t => {
    t.plan(7)

    const app = new Koa()
      .use(errorHandler())
      .use(ctx => {
        ctx.response.body = { data: {} }
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
  }
)
