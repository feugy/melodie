'use strict'

module.exports = {
  rootDir: 'lib/',
  testEnvironment: 'node',
  setupFiles: ['./tests/jest-setup'],
  watchPathIgnorePatterns: ['/node_modules/', '/__nocks__/'],
  setupFilesAfterEnv: ['jest-extended'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  coverageDirectory: '../coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/__nocks__/**',
    '!**/*.test.js',
    '!**/node_modules/**'
  ]
}
