'use strict'

const { doesNotThrow, throws } = require('assert')
const { specifiedRules } = require('graphql')
const checkGraphQLValidationRules = require('../../lib/checkGraphQLValidationRules')

module.exports = tests => {
  tests.add(
    '`checkGraphQLValidationRules` with valid GraphQL validation rules.',
    () => {
      doesNotThrow(() => checkGraphQLValidationRules(specifiedRules, 'Test'))
    }
  )

  tests.add('`checkGraphQLValidationRules` with a non array.', () => {
    throws(() => checkGraphQLValidationRules(false, 'Test'), {
      name: 'InternalServerError',
      message: 'Test GraphQL validation rules must be an array.',
      status: 500,
      expose: false
    })
  })

  tests.add('`checkGraphQLValidationRules` with non function rules.', () => {
    throws(() => checkGraphQLValidationRules([false], 'Test'), {
      name: 'InternalServerError',
      message: 'Test GraphQL validation rules must be functions.',
      status: 500,
      expose: false
    })
  })
}
