'use strict'

module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./lib/tests/jest-setup'],
  setupFilesAfterEnv: ['jest-extended/all'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  collectCoverageFrom: [
    'main.js',
    'lib/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
    '!**/lib/tests/**'
  ]
}
