'use strict'

/**
 * Asynchronously starts a given Koa app server.
 * @kind function
 * @name startServer
 * @param {object} app Koa app.
 * @returns {Promise<{port: number, close: Function}>} Resolves the port the server is listening on, and a server close function.
 * @ignore
 */
module.exports = function startServer(app) {
  return new Promise((resolve, reject) => {
    app.listen(function(error) {
      if (error) reject(error)
      else
        resolve({
          port: this.address().port,
          close: () => this.close()
        })
    })
  })
}
