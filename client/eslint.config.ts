import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['**/node_modules', '**/coverage', '**/build', '**/dist']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
  },
  // tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  pluginReactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: tseslint.parser,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      'react/jsx-key': 0,
      'jsx-a11y/anchor-is-valid': 0,
      'react-hooks/exhaustive-deps': 0,
      'react-hooks/rules-of-hooks': 0,
      'react-hooks/preserve-manual-memoization': 0,
      'react-hooks/set-state-in-effect': 0,
      'react-hooks/static-components': 0,
      'react-hooks/use-memo': 0,
      'react-hooks/refs': 0,
      'react/display-name': 0,
      'react/prop-types': 0,
    },
  },
]);
