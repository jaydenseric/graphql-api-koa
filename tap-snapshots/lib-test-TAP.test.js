/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`lib/test TAP GraphQL execute middleware options missing. > Creation error. 1`] = `
{ message: 'GraphQL execute middleware options missing.',
  status: 500,
  expose: false }
`

exports[`lib/test TAP GraphQL execute middleware options not an object. > Creation error. 1`] = `
{ message: 'GraphQL execute middleware options must be an object.',
  status: 500,
  expose: false }
`

exports[`lib/test TAP GraphQL execute middleware option \`override\` not a function. > Creation error. 1`] = `
{ message:
   'GraphQL execute middleware \`override\` option must be a function.',
  status: 500,
  expose: false }
`

exports[`lib/test TAP GraphQL execute middleware option \`override\` not an object. > Koa app error event. 1`] = `
{ message:
   'GraphQL execute middleware options must be an object, or an object promise.',
  status: 500,
  expose: false }
`

exports[`lib/test TAP GraphQL execute middleware option \`override\` not an object. > Response body. 1`] = `
{ errors: [ { message: 'Internal Server Error' } ] }
`

exports[`lib/test TAP GraphQL execute middleware option \`rootValue\`. > Response body. 1`] = `
{ data: { test: 'rootValue' } }
`

exports[`lib/test TAP GraphQL execute middleware option \`rootValue\` override using Koa ctx. > Response body. 1`] = `
{ data: { test: 'rootValueOverridden' } }
`

exports[`lib/test TAP GraphQL execute middleware option \`contextValue\`. > Response body. 1`] = `
{ data: { test: 'contextValue' } }
`

exports[`lib/test TAP GraphQL execute middleware option \`contextValue\` override using Koa ctx. > Response body. 1`] = `
{ data: { test: 'contextValueOverridden' } }
`

exports[`lib/test TAP GraphQL execute middleware option \`fieldResolver\`. > Response body. 1`] = `
{ data: { test: 'fieldResolver' } }
`

exports[`lib/test TAP GraphQL execute middleware option \`fieldResolver\` override using Koa ctx. > Response body. 1`] = `
{ data: { test: 'fieldResolverOverridden' } }
`

exports[`lib/test TAP GraphQL execute middleware option \`schema\` not a GraphQLSchema instance. > Creation error. 1`] = `
{ message:
   'GraphQL schema is required and must be a \`GraphQLSchema\` instance.',
  status: 500,
  expose: false }
`

exports[`lib/test TAP GraphQL execute middleware option \`schema\` override not a GraphQLSchema instance. > Koa app error event. 1`] = `
{ message:
   'GraphQL schema is required and must be a \`GraphQLSchema\` instance.',
  status: 500,
  expose: false }
`

exports[`lib/test TAP GraphQL execute middleware option \`schema\` override not a GraphQLSchema instance. > Response body. 1`] = `
{ errors: [ { message: 'Internal Server Error' } ] }
`

exports[`lib/test TAP GraphQL execute middleware option \`schema\` GraphQL invalid. > Creation error. 1`] = `
{ message: 'GraphQL schema validation errors.',
  graphqlErrors:
   [ { message: 'Query root type must be provided.',
       locations: undefined,
       path: undefined } ],
  status: 500,
  expose: false }
`

exports[`lib/test TAP GraphQL execute middleware option \`schema\` override GraphQL invalid. > Koa app error event. 1`] = `
{ message: 'GraphQL schema validation errors.',
  graphqlErrors:
   [ { message: 'Query root type must be provided.',
       locations: undefined,
       path: undefined } ],
  status: 500,
  expose: false }
`

exports[`lib/test TAP GraphQL execute middleware option \`schema\` override GraphQL invalid. > Response body. 1`] = `
{ errors: [ { message: 'Internal Server Error' } ] }
`

exports[`lib/test TAP Request body missing due to absent body parser middleware. > Koa app error event. 1`] = `
{ message: 'Request body missing.', status: 500, expose: false }
`

exports[`lib/test TAP Request body missing due to absent body parser middleware. > Response body. 1`] = `
{ errors: [ { message: 'Internal Server Error' } ] }
`

exports[`lib/test TAP Request body invalid. > Koa app error event. 1`] = `
{ message: 'Request body must be a JSON object.',
  status: 400,
  expose: true }
`

exports[`lib/test TAP Request body invalid. > Response body. 1`] = `
{ errors: [ { message: 'Request body must be a JSON object.' } ] }
`

exports[`lib/test TAP GraphQL operation field \`query\` missing. > Koa app error event. 1`] = `
{ message: 'GraphQL operation field \`query\` missing.',
  status: 400,
  expose: true }
`

exports[`lib/test TAP GraphQL operation field \`query\` missing. > Response body. 1`] = `
{ errors: [ { message: 'GraphQL operation field \`query\` missing.' } ] }
`

exports[`lib/test TAP GraphQL operation field \`query\` invalid. > Koa app error event. 1`] = `
{ message: 'GraphQL query syntax error: Syntax Error: Unexpected [',
  status: 400,
  expose: true }
`

exports[`lib/test TAP GraphQL operation field \`query\` invalid. > Response body. 1`] = `
{ errors:
   [ { message: 'GraphQL query syntax error: Syntax Error: Unexpected [' } ] }
`

exports[`lib/test TAP GraphQL operation field \`variables\` invalid. > Koa app error event. 1`] = `
{ message:
   'GraphQL operation field invalid: Variables must be provided as an Object where each property is a variable value. Perhaps look to see if an unparsed JSON string was provided.',
  status: 400,
  expose: true }
`

exports[`lib/test TAP GraphQL operation field \`variables\` invalid. > Response body. 1`] = `
{ errors:
   [ { message:
        'GraphQL operation field invalid: Variables must be provided as an Object where each property is a variable value. Perhaps look to see if an unparsed JSON string was provided.' } ] }
`

exports[`lib/test TAP GraphQL operation field \`query\` validation errors. > Koa app error event. 1`] = `
{ message: 'GraphQL query validation errors.',
  graphqlErrors:
   [ { message: 'Cannot query field "wrongOne" on type "Query".',
       locations: [ { line: 1, column: 9 } ],
       path: undefined },
     { message: 'Cannot query field "wrongTwo" on type "Query".',
       locations: [ { line: 1, column: 19 } ],
       path: undefined } ],
  status: 400,
  expose: true }
`

exports[`lib/test TAP GraphQL operation field \`query\` validation errors. > Response body. 1`] = `
{ errors:
   [ { message: 'Cannot query field "wrongOne" on type "Query".',
       locations: [ { line: 1, column: 9 } ] },
     { message: 'Cannot query field "wrongTwo" on type "Query".',
       locations: [ { line: 1, column: 19 } ] } ] }
`

exports[`lib/test TAP GraphQL resolver error. > Koa app error event. 1`] = `
{ expose: true,
  statusCode: 200,
  status: 200,
  graphqlErrors:
   [ { message: 'Resolver error.',
       locations: [ { line: 1, column: 3 } ],
       path: [ 'test' ] } ] }
`

exports[`lib/test TAP GraphQL resolver error. > Response body. 1`] = `
{ errors:
   [ { message: 'Resolver error.',
       locations: [ { line: 1, column: 3 } ],
       path: [ 'test' ] } ] }
`
