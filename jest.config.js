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
        '^.+\\.svelte$': [
          'svelte-jester',
          { preprocess: true, rootMode: 'upward' }
        ],
        '^.+\\.ya?ml$': 'jest-yaml-transform',
        '^.+\\.p?css$': 'jest-css-modules-transform'
      },
      transformIgnorePatterns: ['node_modules/(?!(svelte-spa-router))/'],
      moduleFileExtensions: ['js', 'svelte', 'json', 'yml'],
      setupFiles: ['./tests/jest-setup'],
      setupFilesAfterEnv: [
        'jest-extended',
        '@testing-library/jest-dom/extend-expect'
      ]
    },
    {
      displayName: 'main',
      rootDir: 'main/',
      testEnvironment: 'node',
      setupFiles: ['./tests/jest-setup'],
      watchPathIgnorePatterns: ['/node_modules/', '/__nocks__/'],
      setupFilesAfterEnv: ['jest-extended']
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
    '!**/__mocks__/**',
    '!**/tests/**',
    '!**/*.test.js',
    '!**/*.stories.*',
    '!**/node_modules/**',
    '!**/public/build/**'
  ]
}
