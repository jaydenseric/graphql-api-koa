import createError from 'http-errors'

/**
 * Validates options conform to a whitelist.
 * @kind function
 * @name checkOptions
 * @param {Object} options Options to validate.
 * @param {string[]} allowed Allowed option keys.
 * @param {string} description The start of the error message.
 * @ignore
 */
export const checkOptions = (options, allowed, description) => {
  const invalid = Object.keys(options).filter(
    option => !allowed.includes(option)
  )

  if (invalid.length)
    throw createError(
      `${description} options invalid: \`${invalid.join('`, `')}\`.`
    )
}
