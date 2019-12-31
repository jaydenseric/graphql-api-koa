'use strict'

const { TestDirector } = require('test-director')

const tests = new TestDirector()

require('./checkGraphQLSchema.test')(tests)
require('./checkGraphQLValidationRules.test')(tests)
require('./checkOptions.test')(tests)
require('./errorHandler.test')(tests)
require('./execute.test')(tests)
require('./isEnumerableObject.test')(tests)

tests.run()
