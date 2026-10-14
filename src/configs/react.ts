import eslintReact from '@eslint-react/eslint-plugin';
import {configs, plugins} from 'eslint-config-airbnb-extended';
import reactRefresh from 'eslint-plugin-react-refresh';
import youMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';
import type {ESLint, Linter} from 'eslint';

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
  // Effects that should not be Effects: state derived from other state or
  // props, user-event logic, chained updates, notifying a parent, resetting
  // state on a prop change (use `key`), and hand-rolled store subscriptions
  // (use `useSyncExternalStore`). Complements `react-hooks/set-state-in-effect`.
  {
    files: ['**/*.ts?(x)', '**/*.js?(x)'],
    name: 'react-you-might-not-need-an-effect',
    plugins: {
      'react-you-might-not-need-an-effect':
        youMightNotNeedAnEffect as unknown as ESLint.Plugin,
    },
    rules: {
      'react-you-might-not-need-an-effect/no-adjust-state-on-prop-change':
        'error',
      'react-you-might-not-need-an-effect/no-chain-state-updates': 'error',
      'react-you-might-not-need-an-effect/no-derived-state': 'error',
      'react-you-might-not-need-an-effect/no-event-handler': 'error',
      'react-you-might-not-need-an-effect/no-external-store-subscription':
        'error',
      'react-you-might-not-need-an-effect/no-initialize-state': 'error',
      'react-you-might-not-need-an-effect/no-pass-data-to-parent': 'error',
      'react-you-might-not-need-an-effect/no-pass-live-state-to-parent':
        'error',
      'react-you-might-not-need-an-effect/no-reset-all-state-on-prop-change':
        'error',
    },
  },
  // Nine rules from @eslint-react, not its preset: the preset re-enables hook
  // rules `react-hooks` already owns. An Effect that adds a listener, timer,
  // interval, observer or fetch must tear it down in its cleanup (a fetch
  // through an AbortController). React 19 forms only: `ref` as a prop instead
  // of `forwardRef`, `use(Context)` instead of `useContext`, and `<Context>`
  // instead of `<Context.Provider>`. `no-context-provider` matches by name, so
  // it reports `ThemeContext.Provider` but not `Ctx.Provider`.
  {
    files: ['**/*.ts?(x)', '**/*.js?(x)'],
    name: 'eslint-react',
    plugins: {'@eslint-react': eslintReact as unknown as ESLint.Plugin},
    rules: {
      '@eslint-react/no-context-provider': 'error',
      '@eslint-react/no-forward-ref': 'error',
      '@eslint-react/no-use-context': 'error',
      '@eslint-react/web-api-no-leaked-event-listener': 'error',
      '@eslint-react/web-api-no-leaked-fetch': 'error',
      '@eslint-react/web-api-no-leaked-intersection-observer': 'error',
      '@eslint-react/web-api-no-leaked-interval': 'error',
      '@eslint-react/web-api-no-leaked-resize-observer': 'error',
      '@eslint-react/web-api-no-leaked-timeout': 'error',
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
