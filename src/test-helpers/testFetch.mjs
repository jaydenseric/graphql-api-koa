import fetch from 'node-fetch'

/**
 * Makes a fetch request to the test API.
 * @kind function
 * @name testFetch
 * @param {number} port API URL port.
 * @param {object} options Fetch options.
 * @returns {Promise<Response>} Fetch response.
 * @ignore
 */
export const testFetch = (port, options = {}) =>
  fetch(`http://localhost:${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    ...options
  })
