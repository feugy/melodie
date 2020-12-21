'use strict'

module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./lib/tests/jest-setup'],
  setupFilesAfterEnv: ['jest-extended'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}
