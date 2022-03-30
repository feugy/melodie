export default {
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
      { preprocess: './svelte-jester.config.js' }
    ],
    '^.+\\.ya?ml$': 'jest-yaml-transform'
  },
  moduleNameMapper: {
    '^.+\\.(post)?css$': 'identity-obj-proxy'
  },
  transformIgnorePatterns: ['node_modules\\/(?!svelte|@atelier-wb)'],
  moduleFileExtensions: ['js', 'svelte', 'json', 'yml'],
  setupFilesAfterEnv: [
    'jest-extended/all',
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
    '!atelier-setup.js',
    '!**/*.test.js',
    '!**/*.tools.svelte'
  ]
}
