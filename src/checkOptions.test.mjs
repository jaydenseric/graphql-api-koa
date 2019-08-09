import t from 'tap'
import { checkOptions } from './checkOptions'

t.test('`checkOptions` with valid options.', t => {
  t.doesNotThrow(
    () => checkOptions({ a: true }, ['a'], 'Test'),
    'Doesn’t throw.'
  )
  t.end()
})

t.test('`checkOptions` with unenumerable options.', t => {
  t.throws(
    () => checkOptions(null, ['a'], 'Test'),
    {
      message: 'Test options must be an enumerable object.',
      status: 500,
      statusCode: 500,
      expose: false
    },
    'throws.'
  )
  t.end()
})

t.test('`checkOptions` with invalid option keys.', t => {
  t.throws(
    () => checkOptions({ a: true, b: true, c: true }, ['b'], 'Test'),
    {
      message: 'Test options invalid: `a`, `c`.',
      status: 500,
      statusCode: 500,
      expose: false
    },
    'throws.'
  )
  t.end()
})
