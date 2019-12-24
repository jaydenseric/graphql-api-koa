import assert from 'assert'
import { specifiedRules } from 'graphql'
import { checkGraphQLValidationRules } from '../checkGraphQLValidationRules.mjs'

export default tests => {
  tests.add(
    '`checkGraphQLValidationRules` with valid GraphQL validation rules.',
    () => {
      assert.doesNotThrow(() =>
        checkGraphQLValidationRules(specifiedRules, 'Test')
      )
    }
  )

  tests.add('`checkGraphQLValidationRules` with a non array.', () => {
    assert.throws(() => checkGraphQLValidationRules(false, 'Test'), {
      name: 'InternalServerError',
      message: 'Test GraphQL validation rules must be an array.',
      status: 500,
      statusCode: 500,
      expose: false
    })
  })

  tests.add('`checkGraphQLValidationRules` with non function rules.', () => {
    assert.throws(() => checkGraphQLValidationRules([false], 'Test'), {
      name: 'InternalServerError',
      message: 'Test GraphQL validation rules must be functions.',
      status: 500,
      statusCode: 500,
      expose: false
    })
  })
}
