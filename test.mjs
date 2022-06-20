import TestDirector from "test-director";

import testCheckGraphQLSchema from "./checkGraphQLSchema.test.mjs";
import testCheckGraphQLValidationRules from "./checkGraphQLValidationRules.test.mjs";
import testCheckOptions from "./checkOptions.test.mjs";
import testErrorHandler from "./errorHandler.test.mjs";
import testExecute from "./execute.test.mjs";

const tests = new TestDirector();

testCheckGraphQLSchema(tests);
testCheckGraphQLValidationRules(tests);
testCheckOptions(tests);
testErrorHandler(tests);
testExecute(tests);

tests.run();
