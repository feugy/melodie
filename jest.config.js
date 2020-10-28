'use strict'

const svelteProjectConfig = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
      }
    ],
    '^.+\\.stories\\.js$': require.resolve(
      '@storybook/addon-storyshots/injectFileName'
    ),
    '^.+\\.svelte$': [
      'svelte-jester',
      { preprocess: true, rootMode: 'upward' }
    ],
    '^.+\\.ya?ml$': 'jest-yaml-transform',
    '^.+\\.css$': 'jest-css-modules-transform'
  },
  transformIgnorePatterns: ['node_modules\\/(?!svelte|tailwindcss|@storybook)'],
  moduleFileExtensions: ['js', 'svelte', 'json', 'yml'],
  setupFilesAfterEnv: [
    'jest-extended',
    '@testing-library/jest-dom/extend-expect'
  ],
  setupFiles: ['./tests/jest-setup']
}

module.exports = {
  projects: [
    {
      displayName: 'renderer',
      rootDir: 'renderer/',
      ...svelteProjectConfig
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
      displayName: 'site',
      rootDir: 'site/src/',
      ...svelteProjectConfig
    }
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  collectCoverageFrom: [
    '**/*.js',
    '**/*.svelte',
    '!**/__nocks__/**',
    '!**/tests/**',
    '!**/*.test.js',
    '!**/*.stories.*',
    '!**/node_modules/**',
    '!**/public/build/**',
    '!**/tailwind.svelte',
    '!**/__sapper__/**'
  ]
}
