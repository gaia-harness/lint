import i18next from 'eslint-plugin-i18next';
import type {Linter} from 'eslint';

/**
 * i18n flat-config block (opt-in), for projects that translate their UI.
 *
 * `i18next/no-literal-string` in `jsx-text-only` mode reports raw text between
 * JSX tags (`<p>Hello</p>`), which should come from `t()`. Attributes and
 * plain string literals are not checked: `jsx-only` mode flags `data-slot`,
 * `htmlFor`, `value` and the like, which are not UI copy.
 *
 * Stories, tests, `tests/` helpers and the vendored shadcn ui files are
 * exempt. Text that must stay untranslated (an error boundary that renders
 * without i18n) takes an inline disable with a reason.
 *
 * A project that drops i18n removes `...lint.i18n` from its config.
 */
export const buildI18n = (sourceDir: string): Linter.Config[] => [
  {
    files: [`${sourceDir}/**/*.tsx`, `${sourceDir}/**/*.jsx`],
    ignores: [
      '**/*.test.tsx',
      '**/*.stories.tsx',
      '**/tests/**',
      `${sourceDir}/components/ui/*.tsx`,
    ],
    name: 'i18n/no-literal-string',
    plugins: {i18next},
    rules: {
      'i18next/no-literal-string': ['error', {mode: 'jsx-text-only'}],
    },
  },
];
