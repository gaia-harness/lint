import tanstackQuery from '@tanstack/eslint-plugin-query';
import type {ESLint, Linter} from 'eslint';
import noImperativeQueryFetchPlugin from '../plugins/no-imperative-query-fetch.js';
import {ONLY_EXPORT_COMPONENTS_OPTIONS} from './react.js';
import {
  REACT_DOCTOR_CAPABILITIES,
  REACT_DOCTOR_MODULE_SCOPE_RULES,
  REACT_DOCTOR_PLUGINS,
  REACT_DOCTOR_QUERY_RULES,
  REACT_DOCTOR_REACT_ROUTER_RULES,
} from './react-doctor.js';

/**
 * `@tanstack/eslint-plugin-query`'s recommended rules, read from its flat
 * preset so a plugin bump carries upstream's recommended set and severities.
 */
const TANSTACK_QUERY_RECOMMENDED_RULES: Linter.RulesRecord = Object.assign(
  {},
  ...tanstackQuery.configs['flat/recommended'].map(
    (config) => config.rules as Linter.RulesRecord,
  ),
);

/**
 * The named exports React Router reads from a route module. Its Vite plugin
 * hot-updates these alongside the component, so they do not cost a full
 * reload.
 */
const ROUTE_MODULE_EXPORTS = [
  'action',
  'clientAction',
  'clientLoader',
  'clientMiddleware',
  'ErrorBoundary',
  'handle',
  'headers',
  'HydrateFallback',
  'Layout',
  'links',
  'loader',
  'meta',
  'middleware',
  'shouldRevalidate',
];

/**
 * React Router flat-config block. Optional, and required only for projects
 * running React Router in framework mode.
 *
 * Its route block is SUBTRACTIVE: it relaxes a rule the rest of the bundle
 * turns on, rather than adding rules the way `storybook` and `playwright` do. That
 * is why it ships separately instead of living inside `react`. Its glob,
 * `**\/routes/**\/*.tsx`, is not unique to React Router (TanStack Router uses
 * a `routes/` directory too), so folding it into `react` would silently
 * weaken lint for every file-based router that isn't React Router.
 *
 * Spread it after `react`:
 *
 *   ...lint.react,
 *   ...lint.reactRouter,
 *
 * `no-empty-pattern` is off because a React Router route module destructures
 * nothing from its typed props (`({}: Route.ComponentProps)`), which the rule
 * reads as an empty pattern. TanStack Router names its component
 * (`createFileRoute(...)({component: Named})`) and never produces that shape,
 * so a TanStack project wants the rule left on.
 *
 * It also carries ADDITIVE rules on every TypeScript file under the source
 * dir: the curated react-doctor React Router and Query rules with the
 * capability settings they need, the `@tanstack/eslint-plugin-query`
 * recommended rules, and `no-imperative-query-fetch`. That last one sits on every
 * TypeScript file under the source dir. It bans `ensureQueryData`,
 * `fetchQuery`, `prefetchQuery` and their infinite variants, so a route has
 * one fetch idiom: `queryClient.query` awaited in a clientLoader, read with
 * `useSuspenseQuery`. That idiom is React Router's, which is why the rule
 * lives here. It reports on any member call by name, so it needs no TanStack
 * Query install to fire.
 *
 * Route modules, and `root.tsx` (the root route), may also export React
 * Router's route-module names (`loader`, `action`, `meta`, ...) beside their
 * component without tripping `react-refresh/only-export-components`.
 */
export const buildReactRouter = (sourceDir: string): Linter.Config[] => [
  {
    files: ['**/routes/**/*.tsx'],
    name: 'react-router/routes',
    rules: {
      'no-empty-pattern': 'off',
    },
  },
  {
    files: ['**/routes/**/*.tsx', `${sourceDir}/root.tsx`],
    ignores: ['**/*.test.tsx', '**/*.stories.tsx', '**/tests/**'],
    name: 'react-router/route-module-exports',
    rules: {
      'react-refresh/only-export-components': [
        'error',
        {...ONLY_EXPORT_COMPONENTS_OPTIONS, allowExportNames: ROUTE_MODULE_EXPORTS},
      ],
    },
  },
  // TanStack Query, one block: `no-imperative-query-fetch`, the official
  // `@tanstack/eslint-plugin-query` recommended rules, and the react-doctor
  // Query rules the official plugin does not cover (`react-doctor.ts`). The
  // official and react-doctor rules match hooks and clients imported from
  // TanStack Query, so they stay silent in a project without Query.
  // `no-imperative-query-fetch` matches by method name.
  {
    files: [`${sourceDir}/**/*.ts?(x)`],
    name: 'react-router/no-imperative-query-fetch',
    plugins: {
      '@tanstack/query': tanstackQuery as unknown as ESLint.Plugin,
      'no-imperative-query-fetch': noImperativeQueryFetchPlugin,
      ...REACT_DOCTOR_PLUGINS,
    },
    rules: {
      ...TANSTACK_QUERY_RECOMMENDED_RULES,
      ...REACT_DOCTOR_QUERY_RULES,
      'no-imperative-query-fetch/no-imperative-query-fetch': 'error',
    },
  },
  // react-doctor's CLI detects a project's capabilities and hands them to its
  // rules; the standalone plugin reads them from these settings instead (see
  // `REACT_DOCTOR_CAPABILITIES`). Route detection matches `app/routes/`,
  // `app/root.*` and `app/entry.*`.
  {
    files: [`${sourceDir}/**/*.ts?(x)`],
    name: 'react-doctor/react-router-settings',
    settings: {
      'react-doctor': {capabilities: REACT_DOCTOR_CAPABILITIES},
    },
  },
  // Curated react-doctor rules (see `react-doctor.ts`) for React Router
  // framework-mode mistakes that throw or misbehave at runtime: loaders,
  // actions, middleware, sessions, cookies, search params, navigation, error
  // UI and the server entry.
  {
    files: [`${sourceDir}/**/*.ts?(x)`],
    name: 'react-doctor/react-router',
    plugins: REACT_DOCTOR_PLUGINS,
    rules: REACT_DOCTOR_REACT_ROUTER_RULES,
  },
  // A browser global read at module scope crashes the server render. Source
  // modules only: tests, stories and the helpers in `tests/` folders run in a
  // browser or a DOM environment, never through SSR.
  {
    files: [`${sourceDir}/**/*.ts?(x)`],
    ignores: ['**/*.test.ts?(x)', '**/*.stories.ts?(x)', '**/tests/**'],
    name: 'react-doctor/react-router-module-scope',
    plugins: REACT_DOCTOR_PLUGINS,
    rules: REACT_DOCTOR_MODULE_SCOPE_RULES,
  },
];
