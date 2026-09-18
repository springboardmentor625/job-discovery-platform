import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // This project does not target the React Compiler. SwipeDeck.jsx
      // deliberately reads ref values during render (see the comments
      // above `previousJobId`, `exitingJobRef`, and `exitAnimationActive`
      // in that file) to synchronously correct state before paint —
      // React's own documented "adjusting state when a prop changes"
      // pattern (https://react.dev/learn/you-might-not-need-an-effect).
      // That pattern is safe without the Compiler but is flagged as an
      // error by this rule, which exists to catch code that would break
      // under Compiler-managed memoization.
      'react-hooks/refs': 'off',
    },
  },
])
