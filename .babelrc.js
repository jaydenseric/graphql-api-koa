const {
  engines: { node }
} = require('./package.json')

module.exports = {
  comments: false,
  presets: [
    [
      '@babel/env',
      {
        targets: { node: node.substring(2) }, // Strip `>=`
        modules: process.env.ESM ? false : 'commonjs',
        loose: true
      }
    ]
  ]
}
