'use strict'

const fetch = require('node-fetch')

/**
 * Fetches JSON at a given localhost port.
 * @kind function
 * @name fetchJsonAtPort
 * @param {number} port Localhost port.
 * @param {object} options Fetch options.
 * @returns {Promise<Response>} Fetch response.
 * @ignore
 */
module.exports = function fetchJsonAtPort(port, options = {}) {
  return fetch(`http://localhost:${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    ...options
  })
}
