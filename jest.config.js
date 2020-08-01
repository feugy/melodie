'use strict'

module.exports = {
  projects: [
    {
      displayName: 'renderer',
      rootDir: 'renderer/',
      testEnvironment: 'jsdom',
      transform: {
        '^.+\\.js$': [
          'babel-jest',
          {
            presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
          }
        ],
        '^.+\\.stories\\.[jt]sx?$': require.resolve(
          '@storybook/addon-storyshots/injectFileName'
        ),
        '^.+\\.svelte$': ['svelte-jester', { preprocess: true }],
        '^.+\\.ya?ml$': 'jest-yaml-transform',
        '^.+\\.p?css$': 'jest-css-modules-transform'
      },
      transformIgnorePatterns: ['node_modules/(?!(svelte-spa-router))/'],
      moduleFileExtensions: ['js', 'svelte', 'json', 'yml'],
      setupFiles: ['./tests/jest-setup'],
      setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect']
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
    '**/*.svelte',
    '!**/tests/**',
    '!**/*.test.js',
    '!**/*.stories.*',
    '!**/node_modules/**',
    '!**/public/build/**'
  ]
}
