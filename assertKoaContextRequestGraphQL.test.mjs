// @ts-check

import { doesNotThrow, throws } from "node:assert";

import assertKoaContextRequestGraphQL from "./assertKoaContextRequestGraphQL.mjs";

/**
 * Adds `assertKoaContextRequestGraphQL` tests.
 * @param {import("test-director").default} tests Test director.
 */
export default (tests) => {
  tests.add(
    "`assertKoaContextRequestGraphQL` with request body invalid, boolean.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: true,
        },
      });

      throws(() => assertKoaContextRequestGraphQL(koaContext), {
        name: "BadRequestError",
        message: "Request body must be a JSON object.",
        status: 400,
        expose: true,
      });
    }
  );

  tests.add(
    "`assertKoaContextRequestGraphQL` with request body invalid, array.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: [],
        },
      });

      throws(() => assertKoaContextRequestGraphQL(koaContext), {
        name: "BadRequestError",
        message: "Request body must be a JSON object.",
        status: 400,
        expose: true,
      });
    }
  );

  tests.add(
    "`assertKoaContextRequestGraphQL` with request body invalid, `query` missing.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: {},
        },
      });

      throws(() => assertKoaContextRequestGraphQL(koaContext), {
        name: "BadRequestError",
        message: "GraphQL operation field `query` missing.",
        status: 400,
        expose: true,
      });
    }
  );

  tests.add(
    "`assertKoaContextRequestGraphQL` with request body invalid, `query` not a string.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: {
            query: true,
          },
        },
      });

      throws(() => assertKoaContextRequestGraphQL(koaContext), {
        name: "BadRequestError",
        message: "GraphQL operation field `query` must be a string.",
        status: 400,
        expose: true,
      });
    }
  );

  tests.add(
    "`assertKoaContextRequestGraphQL` with request body invalid, `operationName` not a string.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: {
            query: "",
            operationName: true,
          },
        },
      });

      throws(() => assertKoaContextRequestGraphQL(koaContext), {
        name: "BadRequestError",
        message: "Request body JSON `operationName` field must be a string.",
        status: 400,
        expose: true,
      });
    }
  );

  tests.add(
    "`assertKoaContextRequestGraphQL` with request body invalid, `variables` invalid, boolean.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: {
            query: "",
            variables: true,
          },
        },
      });

      throws(() => assertKoaContextRequestGraphQL(koaContext), {
        name: "BadRequestError",
        message: "Request body JSON `variables` field must be an object.",
        status: 400,
        expose: true,
      });
    }
  );

  tests.add(
    "`assertKoaContextRequestGraphQL` with request body invalid, `variables` invalid, array.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: {
            query: "",
            variables: [],
          },
        },
      });

      throws(() => assertKoaContextRequestGraphQL(koaContext), {
        name: "BadRequestError",
        message: "Request body JSON `variables` field must be an object.",
        status: 400,
        expose: true,
      });
    }
  );

  tests.add(
    "`assertKoaContextRequestGraphQL` with request body valid, `query` only.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: {
            query: "",
          },
        },
      });

      doesNotThrow(() => assertKoaContextRequestGraphQL(koaContext));
    }
  );

  tests.add(
    "`assertKoaContextRequestGraphQL` with request body valid, `operationName` null.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: {
            query: "",
            operationName: null,
          },
        },
      });

      doesNotThrow(() => assertKoaContextRequestGraphQL(koaContext));
    }
  );

  tests.add(
    "`assertKoaContextRequestGraphQL` with request body valid, `variables` null.",
    () => {
      const koaContext = /** @type {import("koa").ParameterizedContext} */ ({
        request: {
          body: {
            query: "",
            variables: null,
          },
        },
      });

      doesNotThrow(() => assertKoaContextRequestGraphQL(koaContext));
    }
  );

  tests.add("`assertKoaContextRequestGraphQL` with generic arguments.", () => {
    const koaContext =
      /**
       * @type {import("koa").ParameterizedContext<{
       *   a?: 1
       * }, {
       *   b?: 1
       * }>}
       */
      ({
        state: {},
        request: {
          body: {
            query: "",
          },
        },
      });

    assertKoaContextRequestGraphQL(koaContext);

    // @ts-expect-error Testing invalid.
    koaContext.b = true;
    koaContext.b = 1;

    // @ts-expect-error Testing invalid.
    koaContext.state.a = true;
    koaContext.state.a = 1;
  });
};
