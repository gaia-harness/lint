import type {Linter} from 'eslint';
import noImperativeQueryFetchPlugin from '../plugins/no-imperative-query-fetch.js';

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
 * It also carries one ADDITIVE rule, `no-imperative-query-fetch`, on every
 * TypeScript file under the source dir. It bans `ensureQueryData`,
 * `fetchQuery`, `prefetchQuery` and their infinite variants, so a route has
 * one fetch idiom: `queryClient.query` awaited in a clientLoader, read with
 * `useSuspenseQuery`. That idiom is React Router's, which is why the rule
 * lives here. It reports on any member call by name, so it needs no TanStack
 * Query install to fire.
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
    files: [`${sourceDir}/**/*.ts?(x)`],
    name: 'react-router/no-imperative-query-fetch',
    plugins: {'no-imperative-query-fetch': noImperativeQueryFetchPlugin},
    rules: {
      'no-imperative-query-fetch/no-imperative-query-fetch': 'error',
    },
  },
];
