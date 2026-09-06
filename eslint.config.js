import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  js.configs.recommended,

  // Browser code: the site itself.
  {
    files: ['src/**/*.{js,jsx}', 'site.config.js', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs['recommended-latest'].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // This is a template — prop-types would be noise on components that
      // are never reused outside this repo.
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // The timeline lays itself out by measuring the DOM and feeding the
      // result back as state (card heights -> month heights -> positions).
      // That is the measure-then-layout pattern useLayoutEffect exists for,
      // and these two React Compiler rules cannot tell it apart from an
      // accidental render loop. Rules-of-hooks and exhaustive-deps stay on.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
    },
  },

  // Node code: tests and tooling.
  {
    files: ['tests/**/*.js', '*.config.js', '.lintstagedrc.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },

  // Formatting is Prettier's job; turn off every rule that would fight it.
  prettier,
]
