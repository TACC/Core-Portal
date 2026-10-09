import { vi } from 'vitest';
import eslintReact from '@eslint-react/eslint-plugin';
import eslintJs from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { fixupConfigRules } from '@eslint/compat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig, globalIgnores } from 'eslint/config';
export default defineConfig([
  globalIgnores(['**/node_modules', '**/coverage', '**/build', '**/dist']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  eslintJs.configs.recommended,
  tseslint.configs.recommended,
  eslintReact.configs['recommended-typescript'],
  ...fixupConfigRules(jsxA11y.flatConfigs.recommended),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        vi: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Enable JSX syntax support
        },
      },
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
      'react/react-in-jsx-scope': 0,
      'jsx-a11y/anchor-is-valid': 0,

      // React migration / legacy-code compatibility
      '@eslint-react/rules-of-hooks': 0,
      '@eslint-react/static-components': 0,
      '@eslint-react/no-missing-key': 0,
      '@eslint-react/no-nested-component-definitions': 0,
      '@eslint-react/jsx-no-key-after-spread': 'warn',
      '@eslint-react/exhaustive-deps': 'warn',
      '@eslint-react/set-state-in-effect': 'warn',
      '@eslint-react/purity': 'warn',
      'react/display-name': 0,
      'react/prop-types': 0,

      // TypeScript legacy compat
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',

      // TODO: Fix these core ESLint rules
      'no-undef': 'warn',
      'no-dupe-keys': 'warn',
      'no-unsafe-optional-chaining': 'warn',
      'no-constant-binary-expression': 'warn',

      // Legacy compat
      'no-useless-assignment': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-empty': 'warn',
      'no-prototype-builtins': 'warn',
      'preserve-caught-error': 'warn',

      // TODO: Fix these errors
      'no-debugger': 'warn',
      'no-case-declarations': 'warn',
    },
  },
]);
