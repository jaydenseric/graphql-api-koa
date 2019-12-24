import assert from 'assert'
import { checkOptions } from '../checkOptions.mjs'

export default tests => {
  tests.add('`checkOptions` with valid options.', () => {
    assert.doesNotThrow(() => checkOptions({ a: true }, ['a'], 'Test'))
  })

  tests.add('`checkOptions` with unenumerable options.', () => {
    assert.throws(() => checkOptions(null, ['a'], 'Test'), {
      message: 'Test options must be an enumerable object.',
      status: 500,
      statusCode: 500,
      expose: false
    })
  })

  tests.add('`checkOptions` with invalid option keys.', () => {
    assert.throws(
      () => checkOptions({ a: true, b: true, c: true }, ['b'], 'Test'),
      {
        message: 'Test options invalid: `a`, `c`.',
        status: 500,
        statusCode: 500,
        expose: false
      }
    )
  })
}
