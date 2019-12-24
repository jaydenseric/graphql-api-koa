import assert from 'assert'
import Koa from 'koa'
import { createHttpError } from '../createHttpError.mjs'
import { errorHandler } from '../errorHandler.mjs'
import { fetchJsonAtPort } from './fetchJsonAtPort.mjs'
import { startServer } from './startServer.mjs'

export default tests => {
  tests.add('`errorHandler` middleware handles a standard error.', async () => {
    let koaError

    const app = new Koa()
      .use(errorHandler())
      .use(() => {
        throw new Error('Message.')
      })
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port)

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'Error')
      assert.strictEqual(koaError.message, 'Message.')
      assert.strictEqual(koaError.status, 500)
      assert.strictEqual(koaError.expose, false)
      assert.strictEqual(response.status, 500)
      assert.deepStrictEqual(await response.json(), {
        errors: [{ message: 'Internal Server Error' }]
      })
    } finally {
      close()
    }
  })

  tests.add('`errorHandler` middleware handles a HTTP error.', async () => {
    let koaError

    const app = new Koa()
      .use(errorHandler())
      .use(() => {
        throw createHttpError(403, 'Message.')
      })
      .on('error', error => {
        koaError = error
      })

    const { port, close } = await startServer(app)

    try {
      const response = await fetchJsonAtPort(port)

      assert.ok(koaError instanceof Error)
      assert.strictEqual(koaError.name, 'ForbiddenError')
      assert.strictEqual(koaError.message, 'Message.')
      assert.strictEqual(koaError.status, 403)
      assert.strictEqual(koaError.expose, true)
      assert.strictEqual(response.status, 403)
      assert.deepStrictEqual(await response.json(), {
        errors: [{ message: 'Message.' }]
      })
    } finally {
      close()
    }
  })

  tests.add(
    '`errorHandler` middleware handles an error after `ctx.response.body` was set.',
    async () => {
      let koaError

      const app = new Koa()
        .use(errorHandler())
        .use(ctx => {
          ctx.response.body = { data: {} }
          throw new Error('Message.')
        })
        .on('error', error => {
          koaError = error
        })

      const { port, close } = await startServer(app)

      try {
        const response = await fetchJsonAtPort(port)

        assert.ok(koaError instanceof Error)
        assert.strictEqual(koaError.name, 'Error')
        assert.strictEqual(koaError.message, 'Message.')
        assert.strictEqual(koaError.status, 500)
        assert.strictEqual(koaError.expose, false)
        assert.strictEqual(response.status, 500)
        assert.deepStrictEqual(await response.json(), {
          data: {},
          errors: [{ message: 'Internal Server Error' }]
        })
      } finally {
        close()
      }
    }
  )
}
