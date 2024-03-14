module.exports = {
  root: true,
  extends: [
    '@side/base',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:jsdoc/recommended',
  ],
  parser: '@typescript-eslint/parser',
  settings: {
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/resolver': {
      node: {
        extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
      },
      typescript: {
        alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
      },
    },
  },
  rules: {
    'jsdoc/require-returns-type': 0,
    'jsdoc/require-param-type': 0,
    quotes: ['error', 'single', { avoidEscape: true }],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    // Override airbnb extensions settings
    // TODO: Move this to lint-config base
    // Ensure consistent use of file extension within the import path
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/extensions.md
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        mjs: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
  overrides: [],
};
