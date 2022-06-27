// @ts-check

import createHttpError from "http-errors";

/**
 * Validates GraphQL validation rules.
 * @param {ReadonlyArray<import("graphql").ValidationRule>} rules GraphQL
 *   validation rules.
 * @param {string} errorMessagePrefix Error message prefix.
 */
export default function checkGraphQLValidationRules(rules, errorMessagePrefix) {
  if (!Array.isArray(rules))
    throw createHttpError(
      500,
      `${errorMessagePrefix} GraphQL validation rules must be an array.`
    );

  if (rules.some((rule) => typeof rule !== "function"))
    throw createHttpError(
      500,
      `${errorMessagePrefix} GraphQL validation rules must be functions.`
    );
}
