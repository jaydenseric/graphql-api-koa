/**
 * Determines if a value is a plain object.
 * @kind function
 * @name isPlainObject
 * @param {*} value The value to check.
 * @returns {boolean} Is the value a plain object.
 * @ignore
 */
export const isPlainObject = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
