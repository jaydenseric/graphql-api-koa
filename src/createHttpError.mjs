import createError from 'http-errors'

/**
 * A no-operation function.
 * @kind function
 * @name noOp
 * @ignore
 */
const noOp = () => {}

/**
 * Creates a HTTP error, silencing the deprecation warning for an ok status.
 * @kind function
 * @name createHttpError
 * @see [jshttp/http-errors#50](https://github.com/jshttp/http-errors/issues/50)
 * @see [dougwilson/nodejs-depd#29](https://github.com/dougwilson/nodejs-depd/issues/29)
 * @returns {HttpError} A [`http-errors`](https://npm.im/http-errors) `HttpError` instance.
 * @ignore
 */
export function createHttpError(...args) {
  process.on('deprecation', noOp)
  const error = createError(...args)
  process.off('deprecation', noOp)
  return error
}
