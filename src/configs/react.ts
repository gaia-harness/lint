import {configs, plugins} from 'eslint-config-airbnb-extended';
import reactRefresh from 'eslint-plugin-react-refresh';
import type {Linter} from 'eslint';

/**
 * React flat-config block.
 *
 * Ports `reactConfig` + `reactCustomConfig` from GAIA's `eslint.config.mjs`.
 * Pulls React, React Hooks, and JSX A11y plugins plus Airbnb's recommended
 * React config, then layers GAIA's project-wide React rule overrides.
 *
 * Router-specific relaxations live in the optional `reactRouter` block, not
 * here, so a project on a different file-based router keeps its full rule set.
 */
/**
 * Options for `react-refresh/only-export-components`, shared with the route
 * block in `reactRouter`, which repeats them because flat config replaces a
 * rule's options wholesale. Vite's React plugin keeps state across a hot
 * update for constant and compound-component exports, so both are allowed.
 */
export const ONLY_EXPORT_COMPONENTS_OPTIONS = {
  allowCompoundComponents: true,
  allowConstantExport: true,
} as const;

export const react: Linter.Config[] = [
  // React plugin
  plugins.react,
  // React hooks plugin
  plugins.reactHooks,
  // React JSX A11y plugin
  plugins.reactA11y,
  // Airbnb React recommended config
  ...configs.react.recommended,
  {
    name: 'react-custom',
    rules: {
      'jsx-a11y/control-has-associated-label': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'react/boolean-prop-naming': [
        'error',
        {
          propTypeNames: ['bool', 'mutuallyExclusiveTrueProps'],
          rule: '^((can|has|hide|is|show)[A-Z]([A-Za-z0-9]?)+|(checked|disabled|hide|required|show))',
        },
      ],
      'react/function-component-definition': 'off',
      'react/jsx-boolean-value': ['error', 'always'],
      'react/jsx-curly-brace-presence': 'error',
      'react/jsx-filename-extension': 'off',
      'react/jsx-fragments': 'error',
      // off by default because it doesn't handle props onXyz function names correctly
      // turn this on from time to time to check for misnamed handlers elsewhere
      'react/jsx-handler-names': ['off', {checkLocalVariables: true}],
      'react/jsx-newline': ['error', {prevent: true}],
      'react/jsx-no-useless-fragment': ['error', {allowExpressions: true}],
      'react/no-children-prop': 'off',
      'react/no-danger': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
    },
  },
  // A module that exports anything besides components cannot be hot-swapped:
  // Fast Refresh falls back to a full reload and drops component state. Test
  // and story files, and the helpers beside them in `tests/` folders, are never
  // hot-swapped as components, so they are exempt.
  {
    files: ['**/*.tsx', '**/*.jsx'],
    ignores: ['**/*.test.ts?(x)', '**/*.stories.ts?(x)', '**/tests/**'],
    name: 'react-refresh',
    plugins: {'react-refresh': reactRefresh},
    rules: {
      'react-refresh/only-export-components': [
        'error',
        ONLY_EXPORT_COMPONENTS_OPTIONS,
      ],
    },
  },
  {
    files: ['**/*.test.ts?(x)', '**/*.stories.ts?(x)'],
    name: 'react/test-files',
    rules: {
      'react/jsx-props-no-spreading': 'off',
    },
  },
];
