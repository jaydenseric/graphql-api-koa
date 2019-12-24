import fetch from 'node-fetch'

/**
 * Fetches JSON at a given localhost port.
 * @kind function
 * @name fetchJsonAtPort
 * @param {number} port Localhost port.
 * @param {object} options Fetch options.
 * @returns {Promise<Response>} Fetch response.
 * @ignore
 */
export const fetchJsonAtPort = (port, options = {}) =>
  fetch(`http://localhost:${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    ...options
  })
