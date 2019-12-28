'use strict'

const { TestDirector } = require('test-director')
const checkGraphQLSchema = require('./checkGraphQLSchema.test')
const checkGraphQLValidationRules = require('./checkGraphQLValidationRules.test')
const checkOptions = require('./checkOptions.test')
const errorHandler = require('./errorHandler.test')
const execute = require('./execute.test')
const isEnumerableObject = require('./isEnumerableObject.test')

process
  .on('uncaughtException', error => {
    console.error('Uncaught exception:', error)
    process.exitCode = 1
  })
  .on('unhandledRejection', error => {
    console.error('Unhandled rejection:', error)
    process.exitCode = 1
  })

const tests = new TestDirector()

isEnumerableObject(tests)
checkOptions(tests)
checkGraphQLValidationRules(tests)
checkGraphQLSchema(tests)
errorHandler(tests)
execute(tests)

tests.run()
