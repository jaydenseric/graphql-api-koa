// @ts-check

import { doesNotThrow, throws } from "node:assert";

import { specifiedRules } from "graphql";

import checkGraphQLValidationRules from "./checkGraphQLValidationRules.mjs";

/**
 * Adds `checkGraphQLValidationRules` tests.
 * @param {import("test-director").default} tests Test director.
 */
export default (tests) => {
  tests.add(
    "`checkGraphQLValidationRules` with valid GraphQL validation rules.",
    () => {
      doesNotThrow(() => checkGraphQLValidationRules(specifiedRules, "Test"));
    }
  );

  tests.add("`checkGraphQLValidationRules` with a non array.", () => {
    throws(
      () =>
        checkGraphQLValidationRules(
          // @ts-expect-error Testing invalid.
          false,
          "Test"
        ),
      {
        name: "InternalServerError",
        message: "Test GraphQL validation rules must be an array.",
        status: 500,
        expose: false,
      }
    );
  });

  tests.add("`checkGraphQLValidationRules` with non function rules.", () => {
    throws(
      () =>
        checkGraphQLValidationRules(
          [
            // @ts-expect-error Testing invalid.
            false,
          ],
          "Test"
        ),
      {
        name: "InternalServerError",
        message: "Test GraphQL validation rules must be functions.",
        status: 500,
        expose: false,
      }
    );
  });
};
