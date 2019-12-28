'use strict'

const { deepStrictEqual, ok, strictEqual } = require('assert')
const Koa = require('koa')
const createHttpError = require('../lib/createHttpError')
const errorHandler = require('../lib/errorHandler')
const fetchJsonAtPort = require('./fetchJsonAtPort')
const startServer = require('./startServer')

module.exports = tests => {
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

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'Error')
      strictEqual(koaError.message, 'Message.')
      strictEqual(koaError.status, 500)
      strictEqual(koaError.expose, false)
      strictEqual(response.status, 500)
      deepStrictEqual(await response.json(), {
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

      ok(koaError instanceof Error)
      strictEqual(koaError.name, 'ForbiddenError')
      strictEqual(koaError.message, 'Message.')
      strictEqual(koaError.status, 403)
      strictEqual(koaError.expose, true)
      strictEqual(response.status, 403)
      deepStrictEqual(await response.json(), {
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

        ok(koaError instanceof Error)
        strictEqual(koaError.name, 'Error')
        strictEqual(koaError.message, 'Message.')
        strictEqual(koaError.status, 500)
        strictEqual(koaError.expose, false)
        strictEqual(response.status, 500)
        deepStrictEqual(await response.json(), {
          data: {},
          errors: [{ message: 'Internal Server Error' }]
        })
      } finally {
        close()
      }
    }
  )
}
