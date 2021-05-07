import TestDirector from 'test-director';
import testCheckGraphQLSchema from './private/checkGraphQLSchema.test.mjs';
import testCheckGraphQLValidationRules from './private/checkGraphQLValidationRules.test.mjs';
import testCheckOptions from './private/checkOptions.test.mjs';
import testErrorHandler from './public/errorHandler.test.mjs';
import testExecute from './public/execute.test.mjs';

const tests = new TestDirector();

testCheckGraphQLSchema(tests);
testCheckGraphQLValidationRules(tests);
testCheckOptions(tests);
testErrorHandler(tests);
testExecute(tests);

tests.run();
