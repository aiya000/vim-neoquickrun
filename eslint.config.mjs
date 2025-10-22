// @ts-check
import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * TypeScript configuration for vim-neoquickrun
 *
 * @type {import('typescript-eslint/dist/config-helper').InfiniteDepthConfigWithExtends}
 */
const basicConfig = {
  files: ['**/*.ts', '**/*.mts', '**/*.cts'],
  languageOptions: {
    globals: {
      ...globals.es2023,
      Deno: true,
    },
  },
  rules: {
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
    'dot-notation': 'off',
    'import/named': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/array-type': [
      'warn',
      {
        default: 'array',
      },
    ],
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'info', 'debug'],
      },
    ],
  },
}

export default tseslint.config(
  eslint.configs.recommended,
  basicConfig,
  {
    ignores: [
      '.*',
      '.*/*',
      'node_modules/*',
      'dist/*',
      'tmp/*',
      'vendor/*',
    ],
  }
)
