// @ts-check

import { GraphQLError } from "graphql";
import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";

import GraphQLAggregateError from "./GraphQLAggregateError.mjs";

/**
 * Adds `GraphQLAggregateError` tests.
 * @param {import("test-director").default} tests Test director.
 */
export default (tests) => {
  tests.add(
    "`GraphQLAggregateError` constructor, argument 1 `errors` not an array.",
    () => {
      throws(() => {
        new GraphQLAggregateError(
          // @ts-expect-error Testing invalid.
          true,
          "",
          200,
          true
        );
      }, new TypeError("Argument 1 `errors` must be an array."));
    }
  );

  tests.add(
    "`GraphQLAggregateError` constructor, argument 1 `errors` array containing a non `GraphQLError` instance.",
    () => {
      throws(() => {
        new GraphQLAggregateError(
          [
            new GraphQLError("A"),
            // @ts-expect-error Testing invalid.
            true,
          ],
          "",
          200,
          true
        );
      }, new TypeError("Argument 1 `errors` must be an array containing only `GraphQLError` instances."));
    }
  );

  tests.add(
    "`GraphQLAggregateError` constructor, argument 2 `message` not a string.",
    () => {
      throws(() => {
        new GraphQLAggregateError(
          [],
          // @ts-expect-error Testing invalid.
          true,
          200,
          true
        );
      }, new TypeError("Argument 2 `message` must be a string."));
    }
  );

  tests.add(
    "`GraphQLAggregateError` constructor, argument 3 `status` not a number.",
    () => {
      throws(() => {
        new GraphQLAggregateError(
          [],
          "",
          // @ts-expect-error Testing invalid.
          true,
          true
        );
      }, new TypeError("Argument 3 `status` must be a number."));
    }
  );

  tests.add(
    "`GraphQLAggregateError` constructor, argument 4 `expose` not a boolean.",
    () => {
      throws(() => {
        new GraphQLAggregateError(
          [],
          "",
          200,
          // @ts-expect-error Testing invalid.
          1
        );
      }, new TypeError("Argument 4 `expose` must be a boolean."));
    }
  );

  tests.add("`GraphQLAggregateError` constructor, valid.", () => {
    const errors = Object.freeze([
      new GraphQLError("A"),
      new GraphQLError("B"),
    ]);
    const message = "abc";
    const status = 200;
    const expose = true;
    const graphqlAggregateError = new GraphQLAggregateError(
      errors,
      message,
      status,
      expose
    );

    ok(graphqlAggregateError instanceof Error);
    strictEqual(graphqlAggregateError.name, "GraphQLAggregateError");
    deepStrictEqual(graphqlAggregateError.message, message);
    deepStrictEqual(graphqlAggregateError.errors, errors);
    strictEqual(graphqlAggregateError.status, status);
    strictEqual(graphqlAggregateError.expose, expose);
  });
};
