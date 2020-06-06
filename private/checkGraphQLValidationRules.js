'use strict';

const createHttpError = require('http-errors');

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
      500,
      `${errorMessagePrefix} GraphQL validation rules must be an array.`
    );

  if (rules.some((rule) => typeof rule !== 'function'))
    throw createHttpError(
      500,
      `${errorMessagePrefix} GraphQL validation rules must be functions.`
    );
};
