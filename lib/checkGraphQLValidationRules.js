'use strict'

const createHttpError = require('./createHttpError')

/**
 * Validates GraphQL validation rules.
 * @kind function
 * @name checkGraphQLValidationRules
 * @param {Array<Function>} rules GraphQL validation rules.
 * @param {string} errorMessagePrefix Error message prefix.
 * @ignore
 */
module.exports = function checkGraphQLValidationRules(
  rules,
  errorMessagePrefix
) {
  if (!Array.isArray(rules))
    throw createHttpError(
      `${errorMessagePrefix} GraphQL validation rules must be an array.`
    )

  if (rules.some(rule => typeof rule !== 'function'))
    throw createHttpError(
      `${errorMessagePrefix} GraphQL validation rules must be functions.`
    )
}
