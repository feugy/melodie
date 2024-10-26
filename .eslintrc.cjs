module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:svelte/recommended',
    'plugin:vitest/recommended',
    'plugin:testing-library/dom',
    '@electron-toolkit',
    '@electron-toolkit/eslint-config-prettier'
  ],
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  plugins: ['simple-import-sort'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      plugins: ['@babel/plugin-syntax-import-assertions']
    },
    extraFileExtensions: ['.svelte']
  },
  globals: {
    RXJS_VERSION: true,
    UNOCSS_VERSION: true
  },
  overrides: [{ files: ['*.svelte'], parser: 'svelte-eslint-parser' }],
  rules: {
    'simple-import-sort/imports': 'error',
    'testing-library/no-wait-for-multiple-assertions': 'off',
    // 'testing-library/no-await-sync-queries': 'off',
    'testing-library/no-node-access': 'off'
  }
}
