// ESLint v9 flat configuration file
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginReact from 'eslint-plugin-react';

export default [
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  
  // Base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // React config
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: eslintPluginReact
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      ...eslintPluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off'
    }
  },
  
  // Common config for all JS/TS files
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      // Basic style rules
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'linebreak-style': ['error', 'unix'],
      'object-curly-spacing': ['error', 'always'],
      'no-multiple-empty-lines': ['warn', { 'max': 2 }],
      
      // TypeScript rules
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      
      // Padding lines for readability
      'padding-line-between-statements': [
        'error',
        {
          'blankLine': 'always',
          'prev': '*',
          'next': ['return', 'if', 'switch', 'try', 'for']
        },
        {
          'blankLine': 'always',
          'prev': ['if', 'switch', 'try', 'const', 'let'],
          'next': '*'
        },
        {
          'blankLine': 'any',
          'prev': ['const', 'let'],
          'next': ['const', 'let']
        }
      ]
    }
  }
]; 