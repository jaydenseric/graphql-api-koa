// @ts-check

import TestDirector from "test-director";

import testAssertKoaContextRequestGraphQL from "./assertKoaContextRequestGraphQL.test.mjs";
import testCheckGraphQLSchema from "./checkGraphQLSchema.test.mjs";
import testCheckGraphQLValidationRules from "./checkGraphQLValidationRules.test.mjs";
import testCheckOptions from "./checkOptions.test.mjs";
import testErrorHandler from "./errorHandler.test.mjs";
import testExecute from "./execute.test.mjs";
import testGraphQLAggregateError from "./GraphQLAggregateError.test.mjs";

const tests = new TestDirector();

testAssertKoaContextRequestGraphQL(tests);
testCheckGraphQLSchema(tests);
testCheckGraphQLValidationRules(tests);
testCheckOptions(tests);
testErrorHandler(tests);
testExecute(tests);
testGraphQLAggregateError(tests);

tests.run();
