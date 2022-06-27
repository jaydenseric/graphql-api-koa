// @ts-check

import fetch from "node-fetch";

/**
 * Fetches GraphQL from a localhost port.
 * @param {number} port Localhost port.
 * @param {import("node-fetch").RequestInit} options Fetch options.
 * @returns Fetch response.
 */
export default function fetchGraphQL(port, options = {}) {
  return fetch(`http://localhost:${port}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/graphql+json",
      Accept: "application/graphql+json",
    },
    ...options,
  });
}
