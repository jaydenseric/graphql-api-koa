'use strict'

const {
  engines: { node }
} = require('./package.json')

/**
 * A Babel plugin that adds a comment to ignore code coverage for the next line
 * on the line before every Babel `_interopRequireDefault` function return
 * statement.
 * @kind function
 * @name babelPluginCoverageIgnoreBabelInterop
 * @returns {Function} The Babel plugin.
 * @ignore
 */
const babelPluginCoverageIgnoreBabelInterop = () => ({
  visitor: {
    ReturnStatement(path) {
      if (
        path.scope.block &&
        path.scope.block.id &&
        path.scope.block.id.name === '_interopRequireDefault'
      )
        path.addComment('leading', ' coverage ignore next line', true)
    }
  }
})

module.exports = {
  shouldPrintComment: comment =>
    // Preserve coverage ignore comments.
    /@license|@preserve|coverage ignore/.test(comment),
  plugins: [
    'transform-require-extensions',
    babelPluginCoverageIgnoreBabelInterop
  ],
  presets: [
    [
      '@babel/env',
      {
        targets: { node: node.substring(2) }, // Strip `>=`
        modules: process.env.BABEL_ESM ? false : 'commonjs',
        shippedProposals: true,
        loose: true
      }
    ]
  ]
}
