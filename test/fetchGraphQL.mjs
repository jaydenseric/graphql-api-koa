import fetch from 'node-fetch';

/**
 * Fetches GraphQL.
 * @kind function
 * @name fetchGraphQL
 * @param {number} port Localhost port.
 * @param {object} options Fetch options.
 * @returns {Promise<Response>} Fetch response.
 * @ignore
 */
export default function fetchGraphQL(port, options = {}) {
  return fetch(`http://localhost:${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/graphql+json',
      Accept: 'application/graphql+json',
    },
    ...options,
  });
}
