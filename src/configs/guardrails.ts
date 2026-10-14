import path from 'node:path';
import type {Linter} from 'eslint';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import * as regexp from 'eslint-plugin-regexp';
import sonarjs from 'eslint-plugin-sonarjs';
import cnConditionalPlugin from '../plugins/cn-conditional.js';
import noEnumPlugin from '../plugins/no-enum.js';
import noJsxIifePlugin from '../plugins/no-jsx-iife.js';
import noNullRenderPlugin from '../plugins/no-null-render.js';
import noSwitchPlugin from '../plugins/no-switch.js';
import noZodEnumPlugin from '../plugins/no-zod-enum.js';

const buildSonarConfig = (sourceDir: string): Linter.Config[] => [
  sonarjs.configs!.recommended as Linter.Config,
  {
    name: 'sonarjs',
    rules: {
      'sonarjs/cognitive-complexity': 'error',
      'sonarjs/fixme-tag': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-selector-parameter': 'off',
      'sonarjs/regex-complexity': 'off',
      'sonarjs/todo-tag': 'off',
    },
  },
  {
    files: ['**/*.tsx', '**/hooks/*.ts?(x)'],
    name: 'sonarjs/react-files',
    rules: {
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/function-return-type': 'off',
    },
  },
  {
    files: ['**/*.test.ts?(x)', '**/*.stories.ts?(x)'],
    name: 'sonarjs/test-files',
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off',
    },
  },
  {
    files: [`${sourceDir}/languages/**/*.ts`, 'eslint.config.mjs'],
    name: 'sonarjs/credential-checks',
    rules: {
      'sonarjs/no-hardcoded-credentials': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
    },
  },
];

/**
 * Regex correctness. The recommended set catches patterns that can backtrack
 * catastrophically on hostile input (ReDoS), alternatives and character
 * classes that can never match, misleading capture groups, and needless
 * escapes or quantifiers. sonarjs covers only a few of these.
 */
const regexpConfig: Linter.Config[] = [
  {...regexp.configs['flat/recommended'], name: 'regexp'},
];

const cnConditionalConfig: Linter.Config[] = [
  {
    files: ['**/*.ts?(x)', '**/*.js?(x)'],
    name: 'cn-conditional',
    plugins: {'cn-conditional': cnConditionalPlugin},
    rules: {'cn-conditional/cn-conditional': 'error'},
  },
];

const noEnumConfig: Linter.Config[] = [
  {
    files: ['**/*.ts?(x)'],
    name: 'no-enum',
    plugins: {'no-enum': noEnumPlugin},
    rules: {
      'no-enum/no-enum': 'error',
    },
  },
];

const noJsxIifeConfig: Linter.Config[] = [
  {
    files: ['**/*.tsx', '**/*.jsx'],
    name: 'no-jsx-iife',
    plugins: {'no-jsx-iife': noJsxIifePlugin},
    rules: {'no-jsx-iife/no-jsx-iife': 'error'},
  },
];

const noNullRenderConfig: Linter.Config[] = [
  {
    files: ['**/*.tsx', '**/*.jsx'],
    name: 'no-null-render',
    plugins: {'no-null-render': noNullRenderPlugin},
    rules: {'no-null-render/no-null-render': 'error'},
  },
];

const noSwitchConfig: Linter.Config[] = [
  {
    files: ['**/*.ts?(x)', '**/*.js?(x)'],
    name: 'no-switch',
    plugins: {'no-switch': noSwitchPlugin},
    rules: {'no-switch/no-switch': 'error'},
  },
];

const noZodEnumConfig: Linter.Config[] = [
  {
    files: ['**/*.ts?(x)'],
    name: 'no-zod-enum',
    plugins: {'no-zod-enum': noZodEnumPlugin},
    rules: {'no-zod-enum/no-zod-enum': 'error'},
  },
];

/**
 * Architecture-boundary enforcement for GAIA's canonical `app/` layout.
 *
 * Imports may only flow from a higher layer to a lower one:
 *
 *   routes -> pages -> components -> { hooks, state } -> services -> utils -> types
 *
 * `types/` is a pure leaf importable by everyone. Each zone names a lower
 * layer as `target` and the higher layers it must not import as `from`, so a
 * lower-importing-higher edge (the wrong direction) is reported. `routes`
 * appears in every `from` set, which encodes "nothing may import a route".
 *
 * Zone `target`/`from` paths resolve against `process.cwd()` (the consuming
 * project's root where eslint runs), not this package's location in
 * node_modules, so `./${sourceDir}/...` correctly points at the consumer's
 * source tree. `import-x@4.16.2` accepts `from`/`target` as string arrays,
 * which collapses the higher->lower pairs into one zone per target layer.
 *
 * `app/middleware`, `app/sessions.server`, `app/assets`, `app/languages`, and
 * `app/styles` are intentionally left unconstrained (server/asset dirs).
 *
 * The UI layers (pages, components, hooks/state) are exempted from the boundary
 * when importing a typed data-endpoint route (`routes/actions.*`,
 * `routes/resources.*`, or the older `routes/actions+`/`routes/resources+`
 * group folders, still accepted on the 2.x line). These are no-UI, typed data
 * endpoints the UI is explicitly meant to consume (e.g.
 * `useFetcher<typeof action>`). `import-x/no-restricted-paths` cannot
 * distinguish a type-only import, so without this carve-out it flags a
 * component's `import type {action}` from a typed endpoint.
 *
 * These three zones use glob-mode `from` (every entry is a `**` glob), because
 * import-x resolves a plain-mode `except` as a descendant path of `from`, which
 * cannot match a sibling flat route file. In glob mode `except` entries are
 * matched as absolute-path globs against the resolved import path, so they are
 * built from `process.cwd()` (the same default basePath import-x resolves
 * `from` against) rather than written as `**`-relative patterns: a leading `**`
 * does not cross a dot-prefixed path segment, so a `**`-relative pattern goes
 * silently dark under a dot-directory checkout (e.g. a `.claude/worktrees/`
 * worktree). Matching is by basename prefix, not a list of GAIA's endpoint
 * files. The services, utils, and types zones get no exemption, so the
 * carve-out stays within the UI layer.
 */
const buildNoRestrictedPathsConfig = (
  sourceDir: string,
): Linter.Config[] => {
  const dir = (layer: string): string => `./${sourceDir}/${layer}`;
  const globDir = (layer: string): string => `./${sourceDir}/${layer}/**`;
  // Absolute, forward-slash, anchored where import-x resolves `from`
  // (its basePath defaults to process.cwd()).
  const routesDir = path
    .resolve(process.cwd(), sourceDir, 'routes')
    .split(path.sep)
    .join('/');
  const dataEndpoints = [
    `${routesDir}/actions.*`,
    `${routesDir}/resources.*`,
    // Older `+` group folders stay exempt through the 2.x line.
    `${routesDir}/actions+/**`,
    `${routesDir}/resources+/**`,
  ];

  return [
    {
      files: [`${sourceDir}/**/!(*.test|*.stories).ts?(x)`],
      name: 'import-x/architecture-boundaries',
      rules: {
        'import-x/no-restricted-paths': [
          'error',
          {
            zones: [
              {
                except: dataEndpoints,
                from: [globDir('routes')],
                message:
                  'Pages may only be imported by routes; a page must not import a route (import direction is routes -> pages -> components). Typed `actions.*`/`resources.*` data-endpoint routes are exempt (the older `actions+`/`resources+` folders are still accepted).',
                target: dir('pages'),
              },
              {
                except: dataEndpoints,
                from: [globDir('routes'), globDir('pages')],
                message:
                  'Reusable components must not depend on page- or route-level code (import direction is routes -> pages -> components). Typed `actions.*`/`resources.*` data-endpoint routes are exempt (the older `actions+`/`resources+` folders are still accepted).',
                target: dir('components'),
              },
              {
                except: dataEndpoints,
                from: [globDir('routes'), globDir('pages'), globDir('components')],
                message:
                  'Hooks and state sit below the UI tree; they must not import components, pages, or routes. Typed `actions.*`/`resources.*` data-endpoint routes are exempt (the older `actions+`/`resources+` folders are still accepted).',
                target: [dir('hooks'), dir('state')],
              },
              {
                from: [
                  dir('routes'),
                  dir('pages'),
                  dir('components'),
                  dir('hooks'),
                  dir('state'),
                ],
                message:
                  'The service/data layer sits below the UI and orchestration layers; it must not import components, pages, routes, hooks, or state.',
                target: dir('services'),
              },
              {
                from: [
                  dir('routes'),
                  dir('pages'),
                  dir('components'),
                  dir('hooks'),
                  dir('state'),
                  dir('services'),
                ],
                message:
                  'Utils are near-leaves; they may import only types and other utils.',
                target: dir('utils'),
              },
              {
                from: [
                  dir('routes'),
                  dir('pages'),
                  dir('components'),
                  dir('hooks'),
                  dir('state'),
                  dir('services'),
                  dir('utils'),
                ],
                message:
                  'Types are a pure leaf; they must not import any other app layer.',
                target: dir('types'),
              },
            ],
          },
        ],
      },
    },
  ];
};

const buildNoRelativeImportPathsConfig = (
  sourceDir: string,
): Linter.Config[] => [
  {
    name: 'no-relative-import-paths',
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
    },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          allowedDepth: 2,
          allowSameFolder: true,
          prefix: '~',
          rootDir: sourceDir,
        },
      ],
    },
  },
];

export const buildGuardrails = (sourceDir: string): Linter.Config[] => [
  ...buildSonarConfig(sourceDir),
  ...regexpConfig,
  ...cnConditionalConfig,
  ...noEnumConfig,
  ...noJsxIifeConfig,
  ...noNullRenderConfig,
  ...noSwitchConfig,
  ...noZodEnumConfig,
  ...buildNoRestrictedPathsConfig(sourceDir),
  ...buildNoRelativeImportPathsConfig(sourceDir),
];
