import { specifiedRules } from 'graphql'
import t from 'tap'
import { checkGraphQLValidationRules } from './checkGraphQLValidationRules'

t.test(
  '`checkGraphQLValidationRules` with valid GraphQL validation rules.',
  t => {
    t.doesNotThrow(
      () => checkGraphQLValidationRules(specifiedRules, 'Test'),
      'Doesn’t throw.'
    )
    t.end()
  }
)

t.test('`checkGraphQLValidationRules` with a non array.', t => {
  t.throws(
    () => checkGraphQLValidationRules(false, 'Test'),
    {
      name: 'InternalServerError',
      message: 'Test GraphQL validation rules must be an array.',
      status: 500,
      statusCode: 500,
      expose: false
    },
    'Throws.'
  )
  t.end()
})

t.test('`checkGraphQLValidationRules` with non function rules.', t => {
  t.throws(
    () => checkGraphQLValidationRules([false], 'Test'),
    {
      name: 'InternalServerError',
      message: 'Test GraphQL validation rules must be functions',
      status: 500,
      statusCode: 500,
      expose: false
    },
    'Throws.'
  )
  t.end()
})
