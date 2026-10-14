import zodPlugin from 'eslint-plugin-zod';
import type {ESLint, Linter} from 'eslint';

/**
 * Zod flat-config block (opt-in), for Zod 4 projects.
 *
 * `eslint-plugin-zod`'s recommended set: conflicting or duplicate checks,
 * `.optional()` with `.default()`, a `throw` inside `.refine()`, a refine
 * without an error message (users see a generic "Invalid input"),
 * `z.nativeEnum`, `z.any()`, and the Zod 3 forms Zod 4 deprecates.
 *
 * `consistent-import` is off: it wants `import * as z from 'zod'` by default,
 * and even in `named` mode it reports a named `ZodError` import. The
 * stylistic set is not included; it pushes toward enums, which `no-zod-enum`
 * in `guardrails` bans.
 */
export const zod: Linter.Config[] = [
  {
    files: ['**/*.ts?(x)'],
    name: 'zod',
    plugins: {zod: zodPlugin as unknown as ESLint.Plugin},
    rules: {
      ...(zodPlugin.configs.recommended.rules as Linter.RulesRecord),
      'zod/consistent-import': 'off',
    },
  },
];
