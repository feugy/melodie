'use strict'

module.exports = {
  rootDir: 'src/',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
      }
    ],
    '^.+\\.svelte$': [
      'svelte-jester',
      { preprocess: require.resolve('./svelte.config') }
    ],
    '^.+\\.ya?ml$': 'jest-yaml-transform',
    '^.+\\.css$': 'jest-css-modules-transform'
  },
  transformIgnorePatterns: [
    'node_modules\\/(?!svelte-spa-router|svelte-portal|tailwindcss|@atelier-wb)'
  ],
  moduleFileExtensions: ['js', 'svelte', 'json', 'yml'],
  setupFilesAfterEnv: [
    'jest-extended',
    '@testing-library/jest-dom/extend-expect'
  ],
  setupFiles: ['./tests/jest-setup'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  coverageDirectory: '../coverage',
  collectCoverageFrom: [
    '**/*.js',
    '**/*.svelte',
    '!**/atelier/**',
    '!**/*.test.js',
    '!**/*.tools.svelte',
    '!**/tests/**',
    '!**/tailwind.svelte'
  ]
}
