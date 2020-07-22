'use strict'

module.exports = {
  projects: [
    {
      displayName: 'renderer',
      rootDir: 'renderer/',
      transform: {
        '^.+\\.js$': [
          'babel-jest',
          {
            presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
          }
        ]
      }
    },
    {
      displayName: 'main',
      rootDir: 'main/',
      testEnvironment: 'node',
      setupFiles: ['./tests/jest-setup']
    },
    {
      displayName: 'e2e',
      rootDir: 'e2e/'
    }
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  collectCoverageFrom: [
    '**/*.js',
    '!jest.config.js',
    '!**/node_modules/**',
    '!**/public/build/**'
  ]
}
