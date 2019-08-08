/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`lib/errorHandler.test.mjs TAP \`errorHandler\` middleware handles a HTTP error. > Response body. 1`] = `
{"errors":[{"message":"Test."}]}
`

exports[`lib/errorHandler.test.mjs TAP \`errorHandler\` middleware handles a standard error. > Response body. 1`] = `
{"errors":[{"message":"Internal Server Error"}]}
`

exports[`lib/errorHandler.test.mjs TAP \`errorHandler\` middleware handles an error after \`ctx.response.body\` was set. > Response body. 1`] = `
{"data":{},"errors":[{"message":"Internal Server Error"}]}
`
