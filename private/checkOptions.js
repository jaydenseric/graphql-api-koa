'use strict';

const createHttpError = require('http-errors');
const isObject = require('isobject');

/**
 * Validates options are an enumerable object that conforms to a whitelist of
 * allowed keys.
 * @kind function
 * @name checkOptions
 * @param {object} options Options to validate.
 * @param {Array<string>} allowedKeys Allowed option keys.
 * @param {string} errorMessagePrefix Error message prefix.
 * @ignore
 */
module.exports = function checkOptions(
  options,
  allowedKeys,
  errorMessagePrefix
) {
  if (!isObject(options))
    throw createHttpError(
      500,
      `${errorMessagePrefix} options must be an enumerable object.`
    );

  const invalid = Object.keys(options).filter(
    (option) => !allowedKeys.includes(option)
  );

  if (invalid.length)
    throw createHttpError(
      500,
      `${errorMessagePrefix} options invalid: \`${invalid.join('`, `')}\`.`
    );
};
