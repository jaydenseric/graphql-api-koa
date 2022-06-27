// @ts-check

import createHttpError from "http-errors";

/**
 * Validates options are an enumerable object that conforms to a whitelist of
 * allowed keys.
 * @param {{ [key: string]: unknown }} options Options to validate.
 * @param {ReadonlyArray<string>} allowedKeys Allowed option keys.
 * @param {string} errorMessagePrefix Error message prefix.
 */
export default function checkOptions(options, allowedKeys, errorMessagePrefix) {
  if (typeof options !== "object" || options == null || Array.isArray(options))
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
      `${errorMessagePrefix} options invalid: \`${invalid.join("`, `")}\`.`
    );
}
