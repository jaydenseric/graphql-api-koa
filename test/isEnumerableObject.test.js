'use strict'

const { strictEqual } = require('assert')
const isEnumerableObject = require('../lib/isEnumerableObject')

module.exports = tests => {
  tests.add('`isEnumerableObject` with a plain object.', () => {
    strictEqual(isEnumerableObject({}), true)
  })

  tests.add('`isEnumerableObject` with an instance.', () => {
    strictEqual(isEnumerableObject(new Date()), true)
  })

  tests.add('`isEnumerableObject` with null.', () => {
    strictEqual(isEnumerableObject(null), false)
  })

  tests.add('`isEnumerableObject` with an array.', () => {
    strictEqual(isEnumerableObject([]), false)
  })

  tests.add('`isEnumerableObject` with a string.', () => {
    strictEqual(isEnumerableObject(''), false)
  })

  tests.add('`isEnumerableObject` with a boolean.', () => {
    strictEqual(isEnumerableObject(false), false)
  })

  tests.add('`isEnumerableObject` with undefined.', () => {
    strictEqual(isEnumerableObject(undefined), false)
  })
}
