module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:testing-library/dom',
    'plugin:jest-dom/recommended'
  ],
  env: {
    browser: true,
    es2020: true,
    node: true,
    jest: true
  },
  plugins: ['svelte3'],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3'
    },
    {
      files: ['*.js'],
      extends: ['prettier']
    }
  ],
  parserOptions: {
    sourceType: 'module'
  },
  settings: {
    // unfortunately, eslint-plugin-svelte can not work with preprocessors, like postcss
    'svelte3/ignore-styles': () => true
  },
  rules: {
    // some false-positives:
    // /home/damien/dev/perso/melodie/common/core/lib/models/abstract-model.test.js
    //   314:38  error  `getById` query is sync so it does not need to be awaited
    'testing-library/no-await-sync-query': 'off'
  }
}
