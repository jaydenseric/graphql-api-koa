// @ts-check

import { doesNotThrow, throws } from "assert";
import {
  GraphQLError,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";

import checkGraphQLSchema from "./checkGraphQLSchema.mjs";
import GraphQLAggregateError from "./GraphQLAggregateError.mjs";

/**
 * Adds `checkGraphQLSchema` tests.
 * @param {import("test-director").default} tests Test director.
 */
export default (tests) => {
  tests.add("`checkGraphQLSchema` with a valid GraphQL schema.", () => {
    doesNotThrow(() =>
      checkGraphQLSchema(
        new GraphQLSchema({
          query: new GraphQLObjectType({
            name: "Query",
            fields: {
              test: {
                type: GraphQLString,
              },
            },
          }),
        }),
        "Test"
      )
    );
  });

  tests.add("`checkGraphQLSchema` with a non GraphQL schema.", () => {
    throws(
      () =>
        checkGraphQLSchema(
          // @ts-expect-error Testing invalid.
          false,
          "Test"
        ),
      {
        name: "InternalServerError",
        message: "Test GraphQL schema must be a `GraphQLSchema` instance.",
        status: 500,
        expose: false,
      }
    );
  });

  tests.add(
    "`checkGraphQLSchema` with GraphQL schema validation errors.",
    () => {
      throws(
        () => checkGraphQLSchema(new GraphQLSchema({}), "Test"),
        new GraphQLAggregateError(
          [new GraphQLError("Query root type must be provided.")],
          "Test has GraphQL schema validation errors.",
          500,
          false
        )
      );
    }
  );
};
