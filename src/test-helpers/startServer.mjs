/**
 * Asynchronously starts a given Koa app server that automatically closes when
 * the given test tears down.
 * @kind function
 * @name startServer
 * @param {Test} t Tap test.
 * @param {object} app Koa app.
 * @returns {Promise<number>} The port the server is listening on.
 * @ignore
 */
export const startServer = (t, app) =>
  new Promise((resolve, reject) => {
    app.listen(function(error) {
      if (error) reject(error)
      else {
        t.tearDown(() => this.close())
        resolve(this.address().port)
      }
    })
  })
