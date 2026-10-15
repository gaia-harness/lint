import {plugin as shadcnPlugin} from '@shadcn/lint';
import type {ESLint, Linter} from 'eslint';
import {RESTRICTED_IMPORT_PATHS} from './restricted-imports.js';

export type GaiaLintShadcnOptions = {
  /**
   * Fallback: globs where `shadcn/no-restyle` is off outside the vendored ui
   * folder (GAIA-owned components that restyle on purpose). The fallback block
   * always ignores `${sourceDir}/components/ui/**`, so it can never reach the
   * GAIA-authored `ui/tests/**` files.
   *
   * @default []
   */
  restyleOffFiles?: string[];
  /**
   * Import alias of the vendored ui folder. Written to the root-level
   * `settings.shadcn.ui`, never to a rule option, so a later Oxlint config
   * reads it unchanged.
   *
   * @default '~/components/ui'
   */
  ui?: string;
  /**
   * Globs of the vendored ui files (shadcn registry output kept byte-identical
   * to `shadcn add`). Never matches `ui/tests/**`.
   *
   * @default [`${sourceDir}/components/ui/*.tsx`]
   */
  uiFiles?: string[];
};

const SOURCE_EXTENSIONS = '{js,jsx,ts,tsx}';

/**
 * A class whose arbitrary value is a color literal: hex, a CSS color function,
 * or a `color:` type hint.
 */
const ARBITRARY_COLOR_PATTERN = String.raw`^.*\[(#|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color:).*\]$`;

/**
 * Rules turned off for vendored ui files because shadcn's registry output
 * trips them. The list is the empirical one: every rule that fired on
 * unedited `shadcn add` output for the files GAIA ships plus a wider sample of
 * registry items adopters commonly add. Style rules come first, then the
 * correctness-class rules the maintainer sanctioned off for vendored output.
 *
 * Correctness rules not listed here (`react-hooks/*`, `shadcn/no-raw-colors`,
 * and every other rule) stay on.
 */
const VENDORED_UI_RULES_OFF: Linter.RulesRecord = {
  // shadcn emits double-quoted strings.
  '@stylistic/quotes': 'off',
  // shadcn writes `Array<T>`.
  '@typescript-eslint/array-type': 'off',
  // shadcn function declarations use a variable before its declaration
  // (hoisted, no runtime effect), e.g. select.tsx.
  '@typescript-eslint/naming-convention': 'off',
  '@typescript-eslint/no-use-before-define': 'off',
  // toast.tsx re-exports namespace members as `const a = Namespace.a`.
  '@typescript-eslint/prefer-destructuring': 'off',
  // The useMemo callback in field.tsx is flagged; a stylistic async annotation.
  '@typescript-eslint/promise-function-async': 'off',
  // Tailwind class rewrites would change vendored class strings.
  'better-tailwindcss/enforce-canonical-classes': 'off',
  'better-tailwindcss/enforce-shorthand-classes': 'off',
  // shadcn writes `export { A, B }` on one line.
  'canonical/export-specifier-newline': 'off',
  // shadcn uses inline `type` specifiers (`import {cva, type VariantProps}`).
  'import-x/consistent-type-specifier-style': 'off',
  // shadcn renders null from field.tsx.
  'no-null-render/no-null-render': 'off',
  // `_values` in slider.tsx.
  'no-underscore-dangle': 'off',
  'perfectionist/sort-imports': 'off',
  'perfectionist/sort-intersection-types': 'off',
  'perfectionist/sort-jsx-props': 'off',
  'perfectionist/sort-modules': 'off',
  'perfectionist/sort-named-exports': 'off',
  'perfectionist/sort-named-imports': 'off',
  'perfectionist/sort-object-types': 'off',
  'perfectionist/sort-objects': 'off',
  'perfectionist/sort-union-types': 'off',
  // shadcn components are `function` declarations.
  'prefer-arrow-functions/prefer-arrow-functions': 'off',
  // Vendored output is never reformatted; it stays byte-identical to
  // `shadcn add`.
  'prettier/prettier': 'off',
  // Prop names such as `inset` (dropdown-menu).
  'react/boolean-prop-naming': 'off',
  // button.tsx exports `buttonVariants` and toast.tsx exports its toast
  // manager beside their components. A hot update of either falls back to a
  // full reload, which costs dev time only.
  'react-refresh/only-export-components': 'off',
  'sonarjs/prefer-read-only-props': 'off',
  // The `e` handler parameter in input-group.tsx.
  'unicorn/prevent-abbreviations': 'off',
  // Sanctioned correctness-class exemptions for vendored output. Each one
  // trips a pattern in the shadcn source that GAIA does not edit.
  // field.tsx FieldError: `uniqueErrors?.length` optional chain on a non-nullish array.
  '@typescript-eslint/no-unnecessary-condition': 'off',
  // field.tsx FieldError: `uniqueErrors?.length == 1`.
  eqeqeq: 'off',
  // input-group.tsx: InputGroupAddon div with an onClick that focuses the input.
  'jsx-a11y/click-events-have-key-events': 'off',
  // label.tsx: the generic Label primitive renders a <label> with no static control.
  'jsx-a11y/label-has-associated-control': 'off',
  // input-group.tsx: the role="group" div with an onClick.
  'jsx-a11y/no-noninteractive-element-interactions': 'off',
  // field.tsx FieldError: `<li key={index}>` over a static deduped error list.
  'react/no-array-index-key': 'off',
  // input-group.tsx: a `<Button>` className built dynamically. `no-raw-colors`
  // still reads those files.
  'shadcn/require-static-classes': 'off',
  // shadcn writes `import * as React from 'react'`, which the core rule
  // reports against the `FC` ban because a namespace import could reach those
  // names. The block re-declares the shared bans minus the `react` entry
  // (options replace wholesale across blocks), so the other bans hold.
  'no-restricted-imports': [
    'error',
    {paths: RESTRICTED_IMPORT_PATHS.filter((entry) => entry.name !== 'react')},
  ],
  // Registry items may carry an arbitrary color the token contract bans.
  'better-tailwindcss/no-restricted-classes': 'off',
  // sonner.tsx sets CSS variables through a `style` object.
  'shadcn/no-inline-styles': 'off',
  // The vendored files compose each other with `className`.
  'shadcn/no-restyle': 'off',
};

/**
 * `@shadcn/lint` flat-config factory (opt-in).
 *
 * Makes role tokens the only color vocabulary for GAIA components and exempts
 * the vendored shadcn ui files from house style. Returns these blocks:
 *
 * - `shadcn/settings`: no `files`; registers the plugin and sets
 *   `settings.shadcn.ui` at root level.
 * - `shadcn/rules`: source files; `no-raw-colors`, `require-static-classes`,
 *   `no-inline-styles` error, `no-restyle` error with `{allow: ['layout']}`,
 *   `no-arbitrary-values` and `no-unknown-classes` off (better-tailwindcss's
 *   `no-unknown-classes` stays the only unknown-class rule), and
 *   `better-tailwindcss/no-restricted-classes` banning arbitrary colors.
 * - `shadcn/vendored-ui`: `uiFiles` only; `prettier/prettier` and the house
 *   style rules (plus a short maintainer-sanctioned list of correctness-class
 *   rules the shadcn source trips) off. `shadcn/no-raw-colors`, `react-hooks/*`
 *   and every other correctness rule stay on.
 * - `shadcn/restyle-fallback`: only when `restyleOffFiles` is non-empty.
 *
 * ORDERING: the vendored-ui block names rules from plugins the other GAIA
 * blocks register (prettier, prefer-arrow-functions, perfectionist, unicorn,
 * better-tailwindcss, ...), so spread the full GAIA composition before it, and
 * spread `shadcn()` LAST, after `...lint.prettier`, so its `prettier/prettier:
 * off` wins on vendored files.
 *
 * @example
 * ...lint.shadcn({ui: '~/components/ui'})
 */
export const buildShadcn = (
  sourceDir: string,
  opts?: GaiaLintShadcnOptions,
): Linter.Config[] => {
  const ui = opts?.ui ?? '~/components/ui';
  const uiFiles = opts?.uiFiles ?? [`${sourceDir}/components/ui/*.tsx`];
  const restyleOffFiles = opts?.restyleOffFiles ?? [];

  const configs: Linter.Config[] = [
    {
      name: 'shadcn/settings',
      plugins: {shadcn: shadcnPlugin as unknown as ESLint.Plugin},
      settings: {shadcn: {ui}},
    },
    {
      files: [`${sourceDir}/**/*.${SOURCE_EXTENSIONS}`],
      name: 'shadcn/rules',
      rules: {
        // An arbitrary value is allowed where no scale step or token fits;
        // `enforce-canonical-classes` still rewrites one that has a scale
        // equivalent. An arbitrary color is banned: colors are role tokens.
        'better-tailwindcss/no-restricted-classes': [
          'error',
          {
            restrict: [
              {
                message:
                  'Arbitrary colors are not allowed; use a theme role token.',
                pattern: ARBITRARY_COLOR_PATTERN,
              },
            ],
          },
        ],
        'shadcn/no-arbitrary-values': 'off',
        'shadcn/no-inline-styles': 'error',
        'shadcn/no-raw-colors': 'error',
        'shadcn/no-restyle': ['error', {allow: ['layout']}],
        // better-tailwindcss/no-unknown-classes stays the only unknown-class rule.
        'shadcn/no-unknown-classes': 'off',
        'shadcn/require-static-classes': 'error',
      },
    },
    {
      files: uiFiles,
      name: 'shadcn/vendored-ui',
      rules: VENDORED_UI_RULES_OFF,
    },
  ];

  if (restyleOffFiles.length > 0) {
    configs.push({
      files: restyleOffFiles,
      // The vendored ui folder (and with it `ui/tests/**`) is never reached.
      ignores: [`${sourceDir}/components/ui/**`],
      name: 'shadcn/restyle-fallback',
      rules: {'shadcn/no-restyle': 'off'},
    });
  }

  return configs;
};
