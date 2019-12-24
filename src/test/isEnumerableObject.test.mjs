import assert from 'assert'
import { isEnumerableObject } from '../isEnumerableObject.mjs'

export default tests => {
  tests.add('`isEnumerableObject` with a plain object.', () => {
    assert.strictEqual(isEnumerableObject({}), true)
  })

  tests.add('`isEnumerableObject` with an instance.', () => {
    assert.strictEqual(isEnumerableObject(new Date()), true)
  })

  tests.add('`isEnumerableObject` with null.', () => {
    assert.strictEqual(isEnumerableObject(null), false)
  })

  tests.add('`isEnumerableObject` with an array.', () => {
    assert.strictEqual(isEnumerableObject([]), false)
  })

  tests.add('`isEnumerableObject` with a string.', () => {
    assert.strictEqual(isEnumerableObject(''), false)
  })

  tests.add('`isEnumerableObject` with a boolean.', () => {
    assert.strictEqual(isEnumerableObject(false), false)
  })

  tests.add('`isEnumerableObject` with undefined.', () => {
    assert.strictEqual(isEnumerableObject(undefined), false)
  })
}
