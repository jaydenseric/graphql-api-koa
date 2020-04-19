'use strict';

const { TestDirector } = require('test-director');

const tests = new TestDirector();

require('./lib/checkGraphQLSchema.test')(tests);
require('./lib/checkGraphQLValidationRules.test')(tests);
require('./lib/checkOptions.test')(tests);
require('./lib/errorHandler.test')(tests);
require('./lib/execute.test')(tests);

tests.run();
