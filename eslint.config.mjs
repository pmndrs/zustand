import eslint from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import { defineConfig } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import jestDom from 'eslint-plugin-jest-dom'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import testingLibrary from 'eslint-plugin-testing-library'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: ['dist/', 'examples/'],
  },
  eslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.recommended,
  {
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: true,
      },
    },
    rules: {
      eqeqeq: 'error',
      curly: ['warn', 'multi-line', 'consistent'],
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
      'import/no-unresolved': ['error', { commonjs: true, amd: true }],
      'import/named': 'off',
      'import/namespace': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-duplicates': 'error',
      'import/extensions': ['error', 'always', { ignorePackages: true }],
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          'newlines-between': 'never',
          pathGroups: [
            {
              pattern: 'react',
              group: 'builtin',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/react-compiler': 'error',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    ...testingLibrary.configs['flat/react'],
    ...jestDom.configs['flat/recommended'],
    ...vitest.configs.recommended,
    rules: {
      'import/extensions': ['error', 'never'],
      'testing-library/no-node-access': 'off',
      'vitest/consistent-test-it': [
        'error',
        { fn: 'it', withinDescribe: 'it' },
      ],
    },
  },
)
