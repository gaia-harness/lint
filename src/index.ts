import type {Linter} from 'eslint';
import {buildBase} from './configs/base.js';
import {
  betterTailwind,
  type GaiaLintBetterTailwindOptions,
} from './configs/better-tailwind.js';
import {buildGuardrails} from './configs/guardrails.js';
import {ignores, type GaiaLintIgnoresOptions} from './configs/ignores.js';
import {playwright} from './configs/playwright.js';
import {prettier} from './configs/prettier.js';
import {react} from './configs/react.js';
import {buildReactRouter} from './configs/react-router.js';
import {buildShadcn, type GaiaLintShadcnOptions} from './configs/shadcn.js';
import {storybook} from './configs/storybook.js';
import {buildStyleHygiene} from './configs/style-hygiene.js';
import {testing} from './configs/testing.js';

export type {
  GaiaLintBetterTailwindOptions,
  GaiaLintIgnoresOptions,
  GaiaLintShadcnOptions,
};

export type GaiaLintOptions = {
  /**
   * Application source directory (relative to project root). Used to scope
   * file-path-based rules — filename conventions, hook-folder scoping,
   * `no-relative-import-paths` root, etc.
   *
   * @default 'app'
   */
  sourceDir?: string;
};

/**
 * Dual-shape `ignores` accessor. Spread it directly for the default
 * configuration (`...lint.ignores`) or call it to override
 * (`...lint.ignores({extra: ['coverage/**']})`).
 */
export type GaiaLintIgnores = ((
  opts?: GaiaLintIgnoresOptions,
) => Linter.Config[]) &
  Iterable<Linter.Config>;

export type GaiaLintBundle = {
  base: Linter.Config[];
  betterTailwind: (opts: GaiaLintBetterTailwindOptions) => Linter.Config[];
  guardrails: Linter.Config[];
  ignores: GaiaLintIgnores;
  playwright: Linter.Config[];
  prettier: Linter.Config[];
  react: Linter.Config[];
  reactRouter: Linter.Config[];
  /**
   * Opt-in `@shadcn/lint` token rules plus the vendored-ui exemption. Assumes
   * the full GAIA composition is spread before it and must be the LAST entry,
   * after `...lint.prettier`.
   */
  shadcn: (opts?: GaiaLintShadcnOptions) => Linter.Config[];
  storybook: Linter.Config[];
  styleHygiene: Linter.Config[];
  testing: Linter.Config[];
};

const buildIgnoresAccessor = (): GaiaLintIgnores => {
  const defaults = ignores();
  const accessor = ((opts?: GaiaLintIgnoresOptions) => ignores(opts)) as
    | ((opts?: GaiaLintIgnoresOptions) => Linter.Config[]) &
        Iterable<Linter.Config> & {[Symbol.iterator]?: () => Iterator<Linter.Config>};
  accessor[Symbol.iterator] = () => defaults[Symbol.iterator]();
  return accessor as GaiaLintIgnores;
};

/**
 * GAIA lint configuration factory.
 *
 * Call once at the top of your `eslint.config.mjs` to bind a `sourceDir`,
 * then spread the returned configs into `defineConfig`. Defaults to GAIA's
 * `'app'` layout; pass `{sourceDir: 'src'}` (or any other value) for
 * projects that store source elsewhere.
 *
 * @example
 * const lint = gaiaLint();                       // GAIA / app/
 * const lint = gaiaLint({sourceDir: 'src'});     // src/
 */
const gaiaLint = (opts?: GaiaLintOptions): GaiaLintBundle => {
  const sourceDir = opts?.sourceDir ?? 'app';
  return {
    base: buildBase(sourceDir),
    betterTailwind,
    guardrails: buildGuardrails(sourceDir),
    ignores: buildIgnoresAccessor(),
    playwright,
    prettier,
    react,
    reactRouter: buildReactRouter(sourceDir),
    shadcn: (shadcnOpts) => buildShadcn(sourceDir, shadcnOpts),
    storybook,
    styleHygiene: buildStyleHygiene(sourceDir),
    testing,
  };
};

export default gaiaLint;
