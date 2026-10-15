import betterTailwindPlugin from 'eslint-plugin-better-tailwindcss';
import type {Linter} from 'eslint';

export type GaiaLintBetterTailwindOptions = {
  /** Path to the Tailwind entry CSS file (e.g. './app/styles/tailwind.css'). */
  entryPoint: string;
  /** Class names to ignore in `better-tailwindcss/no-unknown-classes`. */
  ignore?: string[];
};

/**
 * Better-Tailwind flat-config factory.
 *
 * Ports `betterTailwindConfig` from GAIA's `eslint.config.mjs`. The
 * `entryPoint` (consumer's Tailwind CSS entry) and `ignore` list are
 * project-specific, so this is shipped as a factory rather than a static
 * array.
 */
export const betterTailwind = (
  opts: GaiaLintBetterTailwindOptions,
): Linter.Config[] => [
  {
    name: 'better-tailwindcss',
    plugins: {
      'better-tailwindcss': betterTailwindPlugin,
    },
    rules: {
      // rootFontSize lets a px arbitrary value canonicalize to its scale step
      // (`w-[16px]` to `w-4`).
      'better-tailwindcss/enforce-canonical-classes': [
        'error',
        {rootFontSize: 16},
      ],
      'better-tailwindcss/enforce-consistent-important-position': 'error',
      'better-tailwindcss/enforce-consistent-variable-syntax': 'error',
      'better-tailwindcss/enforce-shorthand-classes': 'error',
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-deprecated-classes': 'error',
      'better-tailwindcss/no-unknown-classes': [
        'error',
        {ignore: opts.ignore ?? []},
      ],
    },
    settings: {
      'better-tailwindcss': {
        detectComponentClasses: true,
        entryPoint: opts.entryPoint,
      },
    },
  },
];
