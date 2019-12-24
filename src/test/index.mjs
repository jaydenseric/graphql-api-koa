import testDirector from 'test-director'
import checkGraphQLSchema from './checkGraphQLSchema.test.mjs'
import checkGraphQLValidationRules from './checkGraphQLValidationRules.test.mjs'
import checkOptions from './checkOptions.test.mjs'
import errorHandler from './errorHandler.test.mjs'
import execute from './execute.test.mjs'
import isEnumerableObject from './isEnumerableObject.test.mjs'

process
  .on('uncaughtException', error => {
    console.error('Uncaught exception:', error)
    process.exitCode = 1
  })
  .on('unhandledRejection', error => {
    console.error('Unhandled rejection:', error)
    process.exitCode = 1
  })

const tests = new testDirector.TestDirector()

isEnumerableObject(tests)
checkOptions(tests)
checkGraphQLValidationRules(tests)
checkGraphQLSchema(tests)
errorHandler(tests)
execute(tests)

tests.run()
