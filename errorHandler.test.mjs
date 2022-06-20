import { deepStrictEqual, ok, strictEqual } from "assert";
import createHttpError from "http-errors";
import Koa from "koa";

import errorHandler from "./errorHandler.mjs";
import fetchGraphQL from "./test/fetchGraphQL.mjs";
import listen from "./test/listen.mjs";

export default (tests) => {
  tests.add(
    "`errorHandler` middleware handles a non enumerable object error.",
    async () => {
      let koaError;

      const app = new Koa()
        .use(errorHandler())
        .use(() => {
          throw null;
        })
        .on("error", (error) => {
          koaError = error;
        });

      const { port, close } = await listen(app);

      try {
        const response = await fetchGraphQL(port);

        strictEqual(koaError, null);
        strictEqual(
          response.headers.get("Content-Type"),
          "application/graphql+json"
        );
        deepStrictEqual(await response.json(), {
          errors: [{ message: "Internal Server Error" }],
        });
      } finally {
        close();
      }
    }
  );

  tests.add("`errorHandler` middleware handles a standard error.", async () => {
    let koaError;

    const app = new Koa()
      .use(errorHandler())
      .use(() => {
        const error = new Error("Message.");
        error.extensions = { a: true };
        throw error;
      })
      .on("error", (error) => {
        koaError = error;
      });

    const { port, close } = await listen(app);

    try {
      const response = await fetchGraphQL(port);

      ok(koaError instanceof Error);
      strictEqual(koaError.name, "Error");
      strictEqual(koaError.message, "Message.");
      strictEqual(koaError.status, 500);
      strictEqual(koaError.expose, false);
      strictEqual(response.status, 500);
      strictEqual(
        response.headers.get("Content-Type"),
        "application/graphql+json"
      );
      deepStrictEqual(await response.json(), {
        errors: [
          {
            message: "Internal Server Error",
            extensions: { a: true },
          },
        ],
      });
    } finally {
      close();
    }
  });

  tests.add("`errorHandler` middleware handles a HTTP error.", async () => {
    let koaError;

    const app = new Koa()
      .use(errorHandler())
      .use(() => {
        throw createHttpError(403, "Message.", { extensions: { a: true } });
      })
      .on("error", (error) => {
        koaError = error;
      });

    const { port, close } = await listen(app);

    try {
      const response = await fetchGraphQL(port);

      ok(koaError instanceof Error);
      strictEqual(koaError.name, "ForbiddenError");
      strictEqual(koaError.message, "Message.");
      strictEqual(koaError.status, 403);
      strictEqual(koaError.expose, true);
      strictEqual(response.status, 403);
      strictEqual(
        response.headers.get("Content-Type"),
        "application/graphql+json"
      );
      deepStrictEqual(await response.json(), {
        errors: [
          {
            message: "Message.",
            extensions: { a: true },
          },
        ],
      });
    } finally {
      close();
    }
  });

  tests.add(
    "`errorHandler` middleware handles an error after `ctx.response.body` was set.",
    async () => {
      let koaError;

      const app = new Koa()
        .use(errorHandler())
        .use((ctx) => {
          ctx.response.body = { data: {} };

          const error = new Error("Message.");
          error.extensions = { a: true };
          throw error;
        })
        .on("error", (error) => {
          koaError = error;
        });

      const { port, close } = await listen(app);

      try {
        const response = await fetchGraphQL(port);

        ok(koaError instanceof Error);
        strictEqual(koaError.name, "Error");
        strictEqual(koaError.message, "Message.");
        strictEqual(koaError.status, 500);
        strictEqual(koaError.expose, false);
        strictEqual(response.status, 500);
        strictEqual(
          response.headers.get("Content-Type"),
          "application/graphql+json"
        );
        deepStrictEqual(await response.json(), {
          data: {},
          errors: [
            {
              message: "Internal Server Error",
              extensions: { a: true },
            },
          ],
        });
      } finally {
        close();
      }
    }
  );
};
