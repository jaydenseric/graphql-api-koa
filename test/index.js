'use strict';

const { TestDirector } = require('test-director');

const tests = new TestDirector();

require('./private/checkGraphQLSchema.test')(tests);
require('./private/checkGraphQLValidationRules.test')(tests);
require('./private/checkOptions.test')(tests);
require('./public/errorHandler.test')(tests);
require('./public/execute.test')(tests);

tests.run();
