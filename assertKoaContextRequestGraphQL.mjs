// @ts-check

import createHttpError from "http-errors";

/**
 * Asserts that a Koa context has a correctly structured GraphQL request body.
 * @template [KoaContextState=import("koa").DefaultState]
 * @template [KoaContext=import("koa").DefaultContext]
 * @param {import("koa").ParameterizedContext<
 *   KoaContextState,
 *   KoaContext
 * >} koaContext Koa context.
 * @returns {asserts koaContext is KoaContextRequestGraphQL<
 *   KoaContextState,
 *   KoaContext
 * >}
 */
export default function assertKoaContextRequestGraphQL(koaContext) {
  if (typeof koaContext.request.body === "undefined")
    throw createHttpError(500, "Request body missing.");

  if (
    typeof koaContext.request.body !== "object" ||
    koaContext.request.body == null ||
    Array.isArray(koaContext.request.body)
  )
    throw createHttpError(400, "Request body must be a JSON object.");

  if (!("query" in koaContext.request.body))
    throw createHttpError(400, "GraphQL operation field `query` missing.");

  const body = /** @type {{ [key: string]: unknown }} */ (
    koaContext.request.body
  );

  if (typeof body.query !== "string")
    throw createHttpError(
      400,
      "GraphQL operation field `query` must be a string."
    );

  if (
    body.operationName != undefined &&
    body.operationName != null &&
    typeof body.operationName !== "string"
  )
    throw createHttpError(
      400,
      "Request body JSON `operationName` field must be a string."
    );

  if (
    body.variables != undefined &&
    body.variables != null &&
    (typeof body.variables !== "object" || Array.isArray(body.variables))
  )
    throw createHttpError(
      400,
      "Request body JSON `variables` field must be an object."
    );
}

/**
 * @template [KoaContextState=import("koa").DefaultState]
 * @template [KoaContext=import("koa").DefaultContext]
 * @typedef {import("koa").ParameterizedContext<KoaContextState, KoaContext> & {
 *   request: {
 *     body: {
 *       query: string,
 *       operationName?: string | null,
 *       variables?: { [variableName: string]: unknown } | null,
 *       [key: string]: unknown,
 *     }
 *   }
 * }} KoaContextRequestGraphQL
 */
