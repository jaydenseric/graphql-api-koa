export class GraphQLServerError extends Error {
  constructor(message, status, expose) {
    super(message)

    this.name = this.constructor.name
    if (status) this.status = status
    if (expose) this.expose = expose

    Error.captureStackTrace(this, this.constructor)
  }
}

export class OptionsTypeError extends GraphQLServerError {}
export class SchemaTypeError extends GraphQLServerError {}
export class SchemaValidationError extends GraphQLServerError {}
