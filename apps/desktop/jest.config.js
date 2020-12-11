'use strict'

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}
