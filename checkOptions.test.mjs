// @ts-check

import { doesNotThrow, throws } from "assert";

import checkOptions from "./checkOptions.mjs";

/**
 * Adds `checkOptions` tests.
 * @param {import("test-director").default} tests Test director.
 */
export default (tests) => {
  tests.add("`checkOptions` with valid options.", () => {
    doesNotThrow(() => checkOptions({ a: true }, ["a"], "Test"));
  });

  tests.add("`checkOptions` with unenumerable options.", () => {
    throws(
      () =>
        checkOptions(
          // @ts-expect-error Testing invalid.
          null,
          ["a"],
          "Test"
        ),
      {
        message: "Test options must be an enumerable object.",
        status: 500,
        expose: false,
      }
    );
  });

  tests.add("`checkOptions` with invalid option keys.", () => {
    throws(() => checkOptions({ a: true, b: true, c: true }, ["b"], "Test"), {
      message: "Test options invalid: `a`, `c`.",
      status: 500,
      expose: false,
    });
  });
};
