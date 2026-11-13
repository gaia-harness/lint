import type {Linter} from 'eslint';
import canonical from 'eslint-plugin-canonical';
import checkFile from 'eslint-plugin-check-file';
import perfectionist from 'eslint-plugin-perfectionist';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';

const buildCanonicalConfig = (sourceDir: string): Linter.Config[] => [
  canonical.configs['flat/recommended'] as Linter.Config,
  {
    name: 'canonical',
    rules: {
      'canonical/destructuring-property-newline': 'off',
      'canonical/filename-match-exported': 'error',
      'canonical/id-match': 'off',
      'canonical/import-specifier-newline': 'off',
    },
  },
  {
    // Component and page folders are kebab-case while their default export is
    // PascalCase, so `theme-switch/index.tsx` exports `ThemeSwitch`. Scoped to
    // these folders only: a global kebab transform would reject `i18n.ts`
    // exporting `i18n` (lodash kebabs it to `i-18-n`).
    files: [`${sourceDir}/components/**/*.tsx`, `${sourceDir}/pages/**/*.tsx`],
    name: 'canonical/filename-match-exported-kebab',
    rules: {
      'canonical/filename-match-exported': ['error', {transforms: ['kebab']}],
    },
  },
  {
    files: ['**/*.tsx', '**/hooks/*.ts?(x)'],
    name: 'canonical/sort-react-dependencies',
    rules: {
      'canonical/sort-react-dependencies': 'error',
    },
  },
  {
    files: [
      `${sourceDir}/root.tsx`,
      `${sourceDir}/entry.server.tsx`,
      // A route page exports `<Name>Page` from `page.tsx`
      `${sourceDir}/pages/**/page.tsx`,
      `${sourceDir}/**/tests/*`,
      'test/**/*.ts?(x)',
      '**/*.stories.tsx',
      '**/routes/**/*.tsx',
      '**/hooks/*.ts?(x)',
      '.storybook/**/*.ts?(x)',
      '.playwright/**/*.ts?(x)',
    ],
    name: 'canonical/filename-match-exported-disabled',
    rules: {
      'canonical/filename-match-exported': 'off',
    },
  },
];

const perfectionistConfig: Linter.Config[] = [
  perfectionist.configs['recommended-natural'] as Linter.Config,
  {
    name: 'perfectionist',
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          customGroups: [
            {
              elementNamePattern: '^react$',
              groupName: 'react-type',
              selector: 'type',
            },
            {
              elementNamePattern: '^react$',
              groupName: 'react',
            },
            {
              elementNamePattern: '^react-.+',
              groupName: 'react-other-type',
              selector: 'type',
            },
            {
              elementNamePattern: '^react-.+',
              groupName: 'react-other',
            },
          ],
          groups: [
            'react-type',
            'react',
            'react-other-type',
            'react-other',
            ['type-external', 'external'],
            ['type-builtin', 'builtin'],
            ['type-internal', 'internal'],
            ['type-parent', 'parent'],
            ['type-sibling', 'sibling'],
            ['type-index', 'index'],
            'unknown',
            'style',
            'side-effect',
            'side-effect-style',
          ],
          newlinesBetween: 0,
          type: 'natural',
        },
      ],
      // TanStack Query reads option order for type inference: the
      // `@tanstack/query/*-property-order` rules need `onMutate` before
      // `onError` and `onSettled`, and `queryFn` before the page-param
      // getters. Plain natural order puts those keys first, so in the object
      // passed straight to the TanStack call they sort into a last group
      // instead, natural order everywhere else in it. Every other object
      // keeps `recommended-natural`'s sort.
      'perfectionist/sort-objects': [
        'error',
        {
          customGroups: [
            {
              elementNamePattern: '^(onError|onSettled)$',
              groupName: 'after-on-mutate',
            },
          ],
          groups: ['unknown', 'after-on-mutate'],
          order: 'asc',
          type: 'natural',
          useConfigurationIf: {callingFunctionNamePattern: '^useMutation$'},
        },
        {
          customGroups: [
            {
              elementNamePattern: '^(getNextPageParam|getPreviousPageParam)$',
              groupName: 'after-query-fn',
            },
          ],
          groups: ['unknown', 'after-query-fn'],
          order: 'asc',
          type: 'natural',
          useConfigurationIf: {
            callingFunctionNamePattern:
              '^(infiniteQueryOptions|useInfiniteQuery|useSuspenseInfiniteQuery)$',
          },
        },
        {order: 'asc', type: 'natural'},
      ],
      'perfectionist/sort-jsx-props': [
        'error',
        {
          customGroups: [
            {
              elementNamePattern: ['^key$', '^ref$'],
              groupName: 'reserved',
            },
          ],
          groups: ['reserved'],
          type: 'natural',
        },
      ],
    },
  },
];

const unicornConfig: Linter.Config[] = [
  unicorn.configs.recommended as Linter.Config,
  {
    name: 'unicorn',
    rules: {
      'unicorn/consistent-destructuring': 'error',
      'unicorn/consistent-template-literal-escape': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/new-for-builtins': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-export-from': 'off',
      'unicorn/prefer-global-this': 'off',
      // `Array#includes` returns a plain boolean, not a type predicate, so it
      // cannot narrow a union the way an `===` comparison chain does. In a typed
      // codebase the chain is the type-safe idiom; forcing `.includes()` discards
      // the narrowing and the value's refined type along with it.
      'unicorn/prefer-includes-over-repeated-comparisons': 'off',
      'unicorn/prefer-set-has': 'off',
      // Both gate on `definition.kind === 'const'`, which
      // @typescript-eslint/scope-manager never sets (the `const` lives on
      // `definition.parent.kind`), so under the TypeScript parser they cannot
      // report. Off states that instead of implying coverage.
      'unicorn/no-blob-to-file': 'off',
      'unicorn/prefer-set-size': 'off',
      'unicorn/prefer-switch': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          ignore: [
            'acc',
            'ctx',
            'e2e',
            'env',
            'obj',
            'prev',
            'req',
            'res',
            /args/i,
            /fn/i,
            /param/i,
            /params/i,
            /props/i,
            /ref/i,
            /src/i,
            /utils/i,
          ],
        },
      ],
      'unicorn/text-encoding-identifier-case': 'off',
    },
  },
  {
    files: ['./*.ts'],
    name: 'unicorn/root-ts-files',
    rules: {
      'unicorn/prefer-module': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  {
    // Playwright specs run in Node, where `CSS` is undefined: the rule's
    // CSS.escape autofix crashes a spec that queries parsed server HTML.
    // Browser specs select through locators, which the rule never checks.
    files: ['.playwright/**/*.ts?(x)'],
    name: 'unicorn/playwright',
    rules: {
      'unicorn/require-css-escape': 'off',
    },
  },
];

const unusedImportsConfig: Linter.Config[] = [
  {
    name: 'unused-imports',
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/unused-import': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.d.ts'],
    name: 'unused-imports/ts-definition-files',
    rules: {
      'unused-imports/no-unused-vars': 'off',
    },
  },
];

// Subfolders a component or page folder may hold besides nested components.
const RESERVED_FOLDERS = '(assets|hooks|state|tests|utils)';

// The same, plus ui/, whose flat files are not named index.tsx.
const RESERVED_AND_UI_FOLDERS = '(assets|hooks|state|tests|ui|utils)';

// Matches one folder segment that is not exactly one of `names`. micromatch's
// `!(a|b)` alone excludes every segment that merely starts with `a` or `b`
// (`statement` for `state`), so names extending a reserved word are added back.
const notExactly = (names: string): string => `{!${names},@${names}+([a-z0-9-])}`;

const buildCheckFileConfig = (sourceDir: string): Linter.Config[] => [
  {
    plugins: {
      'check-file': checkFile,
    },
  },
  {
    files: [`${sourceDir}/**/*`],
    name: 'check-file',
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          // React hook files are kebab-case with a `use-` prefix (use-theme.ts)
          '**/hooks/*.{ts,tsx}': 'use-+([a-z0-9])*(-+([a-z0-9]))',
          [`${sourceDir}/state/*.tsx`]: 'KEBAB_CASE',
          // Components live in folders, never directly in components/
          [`${sourceDir}/components/*.tsx`]: '!(*)',
          // components/ui/ holds flat kebab-case component files (button.tsx)
          [`${sourceDir}/components/ui/*.tsx`]: 'KEBAB_CASE',
          // Every other component file is named index.tsx
          [`${sourceDir}/components/**/${notExactly(RESERVED_AND_UI_FOLDERS)}/*.tsx`]:
            'index+()',
          // A page folder holds its route page.tsx, or index.tsx for colocated components
          [`${sourceDir}/pages/**/${notExactly(RESERVED_FOLDERS)}/*.tsx`]:
            '@(index|page)',
          // Generally, non-component files must be named kebab-case
          [`${sourceDir}/{components,pages}/**/!(hooks)/*.ts`]: 'KEBAB_CASE',
          // Non-component files inside specific components folders must be kebab-case
          [`${sourceDir}/{components,pages}/**/(assets|state|tests|utils)/*.{ts,tsx}`]:
            'KEBAB_CASE',
          'test/**/*.ts?(x)': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      'check-file/folder-match-with-fex': [
        'error',
        {
          // require stories and test files to be inside tests folders
          '*.(stories|test).{ts,tsx}': `${sourceDir}/**/tests/`,
        },
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          // enforce kebab-case component and page folders; the reserved
          // assets, hooks, state, tests, and utils subfolders are kebab-case too
          [`${sourceDir}/components/**/`]: 'KEBAB_CASE',
          [`${sourceDir}/pages/**/`]: 'KEBAB_CASE',
          // components/ui/ is flat: tests/ is its only subfolder
          [`${sourceDir}/components/ui/*/`]: '@(tests)',
        },
      ],
    },
  },
  {
    files: ['test/**/*.*'],
    name: 'check-file/test-files',
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          'test/**/*.ts?(x)': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },
];

export const buildStyleHygiene = (sourceDir: string): Linter.Config[] => [
  ...buildCanonicalConfig(sourceDir),
  ...perfectionistConfig,
  ...unicornConfig,
  ...unusedImportsConfig,
  ...buildCheckFileConfig(sourceDir),
];
