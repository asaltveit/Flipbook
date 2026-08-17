import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'src/hooks/useImageCreation.js',
    'src/hooks/story-creation2.js',
    'src/components/supabase/**',
  ]),
  {
    files: ['playwright.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'jsx-a11y-x': jsxA11y,
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y-x/no-static-element-interactions': 'warn',
      'jsx-a11y-x/click-events-have-key-events': 'warn',
    },
  },
  {
    files: ['src/components/FlipbookViewer.jsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{js,jsx}', 'e2e/**', 'src/test/**'],
    rules: {
      'jsx-a11y-x/no-static-element-interactions': 'off',
      'jsx-a11y-x/click-events-have-key-events': 'off',
    },
  },
])
