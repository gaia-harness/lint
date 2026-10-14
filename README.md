# @gaia-react/lint

GAIA's lint configuration.

## Install

```sh
pnpm add -D @gaia-react/lint eslint prettier typescript
```

## Quick start

The block below is the actual `eslint.config.mjs` shipped by GAIA. Copy it
verbatim and adjust the override block at the bottom for your project.

```js
import gaiaLint from '@gaia-react/lint';
import {defineConfig} from 'eslint/config';

const lint = gaiaLint();

export default defineConfig([
  ...lint.ignores,
  ...lint.base,
  ...lint.react,
  ...lint.reactRouter,
  ...lint.testing,
  ...lint.storybook,
  ...lint.playwright,
  ...lint.styleHygiene,
  ...lint.guardrails,
  ...lint.betterTailwind({entryPoint: './app/styles/tailwind.css'}),
  ...lint.prettier,
  ...lint.shadcn({ui: '~/components/ui'}), // opt-in; must be last
]);
```

Drop the `reactRouter` line if you are not on React Router framework mode.
See [Router-specific rules](#router-specific-rules). Drop the `shadcn` line if
you do not use shadcn/ui; see [shadcn factory](#shadcn-factory).

## Factory options

`gaiaLint(opts?)` returns a bundle of config blocks. Call it once at the
top of `eslint.config.mjs` and spread the returned configs into
`defineConfig`.

| Option      | Type     | Default | Description                                                                                                                                            |
| ----------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sourceDir` | `string` | `'app'` | Project source directory (relative to repo root). Used to scope filename conventions, hook-folder rules, and the `no-relative-import-paths` root path. |

Non-GAIA projects that store source under `src/` (or any other path):

```js
const lint = gaiaLint({sourceDir: 'src'});
```

That single call rebinds `base`, `reactRouter`, `styleHygiene`, and `guardrails` to the
new source root: no per-config override blocks needed.

## Bundle shape

| Property         | Shape                            | Includes                                                                                                                                          | Required? |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `base`           | `Linter.Config[]`                | JS recommended, TypeScript (typescript-eslint), `import-x`, unused-disable-directive reporting at error, `eslint-comments` (every disable states a reason), `prefer-arrow-functions`, lodash/underscore guard, `no-restricted-imports` (bans bare `@conform-to/zod`) | required  |
| `react`          | `Linter.Config[]`                | `eslint-plugin-react`, `react-hooks`, `jsx-a11y`, `react-refresh` (Fast Refresh-safe exports), GAIA-specific React rules                          | required for React apps |
| `reactRouter`    | `Linter.Config[]`                | Relaxations for React Router framework mode, route-module exports allowed by `react-refresh`, plus `no-imperative-query-fetch` (custom). Spread **after** `react`. See [Router-specific rules](#router-specific-rules) | React Router only |
| `styleHygiene`   | `Linter.Config[]`                | `canonical`, `perfectionist`, `unicorn`, `unused-imports`, `check-file`                                                                           | required  |
| `guardrails`     | `Linter.Config[]`                | `regexp` (recommended, ReDoS included), `no-enum` (custom), `no-switch` (custom), `no-jsx-iife` (custom), `no-null-render` (custom), `no-zod-enum` (custom), `cn-conditional` (custom), `no-relative-import-paths`, `sonarjs`, `import-x`, `prefer-arrow-functions` | required  |
| `testing`        | `Linter.Config[]`                | Vitest + jest-dom config scoped to `*.test.*`, `*.stories.*` and `test/`                                                                          | optional  |
| `storybook`      | `Linter.Config[]`                | `eslint-plugin-storybook` scoped to `*.stories.*` and `.storybook/main.*`                                                                          | optional  |
| `playwright`     | `Linter.Config[]`                | `eslint-plugin-playwright` scoped to `.playwright/`                                                                                                | optional  |
| `prettier`       | `Linter.Config[]`                | `eslint-config-prettier`, must be **last** to disable formatting rules                                                                           | required if using Prettier |
| `shadcn`         | `(opts?) => Linter.Config[]`     | `@shadcn/lint` token rules plus the vendored-ui exemption; see [shadcn factory](#shadcn-factory). Spread **last**, after `prettier`, with the full GAIA composition before it | optional  |
| `betterTailwind` | `(opts) => Linter.Config[]`      | `eslint-plugin-better-tailwindcss` factory; takes `entryPoint` (path to Tailwind entry CSS) and optional `ignore` (class names to skip)           | optional  |
| `ignores`        | `Iterable<Linter.Config> & ((opts?) => Linter.Config[])` | `includeIgnoreFile` helper plus GAIA defaults. Spread directly for defaults (`...lint.ignores`) or call with options to override (`...lint.ignores({extra: ['.gaia/**']})`). | recommended |

## Override patterns

Flat config is last-write-wins. Append override blocks **after** the
gaia-lint spreads to disable, change, or scope rules.

### Disable a rule globally

```js
export default defineConfig([
  ...lint.base,
  ...lint.react,
  {rules: {'sonarjs/cognitive-complexity': 'off'}},
]);
```

### Override on specific globs

```js
export default defineConfig([
  ...lint.base,
  ...lint.react,
  {
    files: ['app/legacy/**'],
    rules: {'sonarjs/cognitive-complexity': 'off'},
  },
]);
```

### Swap parser options

```js
export default defineConfig([
  ...lint.base,
  {
    languageOptions: {
      parserOptions: {project: './tsconfig.eslint.json'},
    },
  },
]);
```

### Add an extra plugin

```js
import myPlugin from 'eslint-plugin-my-plugin';

export default defineConfig([
  ...lint.base,
  ...lint.react,
  {
    plugins: {'my-plugin': myPlugin},
    rules: {'my-plugin/some-rule': 'error'},
  },
]);
```

## Peer dependencies

`eslint`, `prettier`, and `typescript` are declared as **peer
dependencies** so consumers control their own versions and a single resolved
copy of each is installed in `node_modules`. Every other plugin
(`eslint-plugin-react`, `typescript-eslint`, `eslint-plugin-import-x`, etc.)
ships as a direct `dependency` of `@gaia-react/lint` so consumers don't
have to install or upgrade them individually.

Supported versions:

- `eslint ^9.30.0` (`@shadcn/lint` needs 9.30 or later)
- `prettier ^3.0.0`
- `typescript ^5.0.0 || ^6.0.0`

## Custom rules included

These rules are implemented inside this package and ship as part of
`guardrails`.

### `no-enum`

Forbids TypeScript `enum` declarations. Enums emit runtime code, are not
tree-shakeable, conflate value and type space, and have well-known footguns
around numeric vs string enums and reverse mappings. Use a `const` object
plus a derived union type instead.

Opt out for a file or block:

```js
{files: ['src/legacy/**'], rules: {'no-enum/no-enum': 'off'}}
```

### `no-switch`

Forbids `switch` statements. They are an early-return / lookup-map / `if`
chain in disguise and are easy to misuse (fallthrough, missing `default`,
shadowed locals across cases). Replace with a lookup object, an early
`return` chain, or a discriminated-union exhaustiveness check.

Opt out for a file or block:

```js
{files: ['src/parser/**'], rules: {'no-switch/no-switch': 'off'}}
```

### `no-jsx-iife`

Forbids IIFEs (`{(() => { ... })()}`) inside JSX expression containers in `.tsx` and `.jsx` files. IIFEs obscure intent and allocate a new function on every render. Compute the value in a variable before the return statement, or use an inline `&&` expression instead.

Opt out for a file or block:

```js
{files: ['src/legacy/**'], rules: {'no-jsx-iife/no-jsx-iife': 'off'}}
```

### `no-null-render`

Standardizes the empty render on `undefined` instead of `null` in `.tsx` and
`.jsx` files. A `return null` inside a function that provably renders JSX (it
returns a JSX element elsewhere in the same scope) is rewritten to
`return undefined`. `null` and `undefined` are identical to React's reconciler
(both, with `false`/`true`, are the same empty slot); this is a consistency
convention that picks one of two equivalent forms, not a correctness or
performance fix.

Autofixable: `--fix` rewrites `return null` → `return undefined`. The fix is
deliberately conservative and only touches a `return null` whose enclosing
function is provably a render function, so a `return null` in a loader, action,
or plain utility is never altered. `: null` ternary arms are out of scope (the
report-only `no-restricted-syntax` selectors cover those).

Opt out for a file or block:

```js
{files: ['src/legacy/**'], rules: {'no-null-render/no-null-render': 'off'}}
```

### `cn-conditional`

Holds one form for a conditional class passed to `cn` from the
[`cn`](https://www.npmjs.com/package/cn) package: `cond && 'class'` (or
`!cond && 'class'`). It reports an object argument (`cn('a', {b: c})`) and a
ternary with an empty branch (`undefined`, `null`, `false`, `''`, or an empty
template), at any depth inside array arguments, ternary branches, and `&&`,
`||`, or `??` operands. Each offending node is reported once.

Allowed: `cn('a', c && 'b')`, `cn('a', !c && 'b')`, a two-class ternary
(`cn('a', c ? 'b' : 'd')`), `||` and `??` of values, strings, identifiers,
lookups (`VARIANTS[v]`), arrays of those, spreads, and template literals. The
condition side of `&&` and a ternary's test are never inspected.

It only fires on a call to the named import `cn` from `'cn'` (an aliased import
counts). A locally declared `cn`, or a `cn` imported from any other module, is
never reported. It is not autofixable, and it is active in test, story, and
Playwright files as well as source.

Opt out for a file or block:

```js
{files: ['src/legacy/**'], rules: {'cn-conditional/cn-conditional': 'off'}}
```

## Router-specific rules

`reactRouter` is opt-in because it is **subtractive**. `storybook` and
`playwright` only add rules, so spreading them can never weaken anything.
`reactRouter` turns `no-empty-pattern` **off**, and its glob
(`**/routes/**/*.tsx`) is not unique to React Router, since TanStack Router
uses a `routes/` directory too. Shipping it inside `react` silently relaxed
the rule for every file-based router that isn't React Router.

```js
...lint.react,
...lint.reactRouter,   // React Router framework mode only
```

**On React Router?** Spread it. A route module destructures nothing from its
typed props (`({}: Route.ComponentProps)`), which `no-empty-pattern` reads as
an empty pattern.

**On TanStack Router, or any other router?** Omit it, and keep the rule.
`createFileRoute(...)({component: Named})` never produces the empty-pattern
shape. You will most likely also want to ignore your generated route tree:

```js
...lint.ignores({extra: ['**/routeTree.gen.ts']}),
```

`reactRouter` also adds one rule, `no-imperative-query-fetch/no-imperative-query-fetch`,
on every TypeScript file under the source dir. It bans `ensureQueryData`,
`fetchQuery`, `prefetchQuery` and their infinite variants on any member call,
so a route has one fetch idiom: `await queryClient.query(options)` in a
clientLoader, read with `useSuspenseQuery(options)` in the component. It
matches by method name, so it fires whether or not TanStack Query is
installed.

`react` turns on `react-refresh/only-export-components`, because a module that
exports anything besides components cannot be hot-swapped and Fast Refresh
falls back to a full reload. `reactRouter` lets route modules (`**/routes/**`
and `root.tsx`) export React Router's route-module names beside their
component: `loader`, `clientLoader`, `action`, `clientAction`, `middleware`,
`clientMiddleware`, `meta`, `links`, `headers`, `handle`, `shouldRevalidate`,
`ErrorBoundary`, `HydrateFallback` and `Layout`. Any other export from a route
module is still reported; move it to its own module.

The `/.react-router/**` glob stays in the `ignores` defaults. It names a
directory that only exists in a React Router project, so it costs other
projects nothing.

## Tailwind / better-tailwindcss factory

`betterTailwind` is a factory because the underlying plugin needs to know
where your Tailwind entry CSS file lives.

```js
...lint.betterTailwind({
  entryPoint: './app/styles/tailwind.css',
  ignore: ['plain-link', 'plain-table'],
}),
```

| Option       | Type       | Required | Description                                                                                  |
| ------------ | ---------- | -------- | -------------------------------------------------------------------------------------------- |
| `entryPoint` | `string`   | yes      | Path to your Tailwind entry CSS, used by the plugin to resolve the active class set.         |
| `ignore`     | `string[]` | no       | Class names the plugin should ignore in `better-tailwindcss/no-unknown-classes` (e.g. design-system tokens, `plain-*` utility shims). |

## shadcn factory

`shadcn()` bundles [`@shadcn/lint`](https://github.com/shadcn-ui/lint) (an
exact-pinned dependency) so role tokens are the only color vocabulary, and
exempts the vendored shadcn ui files from house style. It is opt-in: omit it
and nothing shadcn-related loads.

```js
...lint.shadcn({ui: '~/components/ui'}), // the LAST entry, after ...lint.prettier
```

| Option            | Type       | Default                                | Description                                                                                                                           |
| ----------------- | ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `ui`              | `string`   | `'~/components/ui'`                    | Import alias of the vendored ui folder, written to the root-level `settings.shadcn.ui` (never a rule option).                         |
| `uiFiles`         | `string[]` | `[`${sourceDir}/components/ui/*.tsx`]` | Globs of the vendored ui files. Never matches `ui/tests/**`.                                                                          |
| `restyleOffFiles` | `string[]` | `[]`                                   | Fallback: globs outside ui where `shadcn/no-restyle` is off. Its block always ignores `${sourceDir}/components/ui/**`, so `ui/tests/**` stays covered. |

Blocks it returns:

- `shadcn/settings`: no `files`; registers the plugin and sets `settings.shadcn.ui`.
- `shadcn/rules`: source files. `shadcn/no-raw-colors`, `shadcn/require-static-classes`,
  `shadcn/no-arbitrary-values` and `shadcn/no-inline-styles` are `error`;
  `shadcn/no-restyle` is `['error', {allow: ['layout']}]`; `shadcn/no-unknown-classes`
  is `off` because `better-tailwindcss/no-unknown-classes` (from `betterTailwind`)
  stays the only unknown-class rule. A marker class a library applies, such as
  sonner's `toaster`, is cleared through `betterTailwind({ignore: ['toaster']})`.
- `shadcn/vendored-ui`: the `uiFiles` only. See below.
- `shadcn/restyle-fallback`: only when `restyleOffFiles` is non-empty.

**Ordering.** The vendored-ui block turns off rules owned by plugins the other
GAIA blocks register (prettier, prefer-arrow-functions, perfectionist, unicorn,
better-tailwindcss, and more), so `shadcn()` assumes the full GAIA composition
is spread before it. Spread it last, after `...lint.prettier`, so its
`prettier/prettier: off` wins on vendored files.

### Vendored ui policy

Files in `components/ui/*.tsx` are registry output kept byte-identical to
`shadcn add`. For them Prettier and the house-style rules are off, so lint
never rewrites a vendored file: `prettier/prettier`, `@stylistic/quotes`,
`prefer-arrow-functions`, the `perfectionist` sort rules, `canonical`,
`unicorn/prevent-abbreviations`, `sonarjs/prefer-read-only-props`, the
better-tailwindcss canonical and shorthand rewrites, naming rules and the
other style rules the registry output trips, plus `shadcn/no-arbitrary-values`,
`shadcn/no-inline-styles` and `shadcn/no-restyle`. Seven correctness-class
rules the shadcn source itself trips are also off there, each commented in the
block: `@typescript-eslint/no-unnecessary-condition`, `eqeqeq`,
`react/no-array-index-key`, `jsx-a11y/label-has-associated-control`,
`jsx-a11y/click-events-have-key-events`,
`jsx-a11y/no-noninteractive-element-interactions` and
`shadcn/require-static-classes`. `react-refresh/only-export-components` is off
too, since `button.tsx` exports `buttonVariants` and `toast.tsx` exports its
toast manager beside their components.

Everything else stays on in vendored ui: `shadcn/no-raw-colors`, `react-hooks/*`,
and every other correctness rule. `components/ui/tests/**` is GAIA-authored and
stays fully linted. If a registry item you add trips a house-style rule not in
the list, extend the block rather than editing the vendored file.

## `FC` and `FunctionComponent` are banned

Importing `FC` or `FunctionComponent` from `'react'` is an error everywhere,
including test and story files (a core `no-restricted-imports` entry in the
shared path list). Type props inline instead:

```tsx
type ButtonProps = {label: string};

const Button = ({label}: ButtonProps) => <button>{label}</button>;
```

## Ignores factory

`ignores` produces a leading flat-config block that merges your
`.gitignore` plus GAIA defaults. `.gitignore` is picked up automatically
if it exists at the project root; no need to declare it.

`lint.ignores` is dual-shape: spread it directly for the default case
(no call), or call it with options to override.

```js
...lint.ignores,                                    // default: auto .gitignore + GAIA defaults
...lint.ignores({extra: ['coverage/**']}),          // + extra globs
...lint.ignores({gitignore: 'config/.gitignore'}),  // override the path
...lint.ignores({gitignore: false}),                // opt out of the merge
```

| Option     | Type              | Required | Description                                                                                                                                                                  |
| ---------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitignore`| `string \| false` | no       | Path to a `.gitignore` file (relative to `cwd` or absolute). Defaults to `'.gitignore'`. Silently skipped if the resolved path does not exist. Pass `false` to opt out entirely. |
| `extra`    | `string[]`        | no       | Extra ignore globs merged with GAIA defaults.                                                                                                                                |

## GAIA folder conventions baked into `check-file`

The `check-file` rules in `styleHygiene` encode GAIA's folder layout (with
`sourceDir` substituted for the literal `app/` prefix). Every folder and file
name is kebab-case:

```
<sourceDir>/
  components/
    ui/                     flat kebab-case files (button.tsx); tests/ is the only subfolder
    <name>/index.tsx        one folder per component, default export in PascalCase
      tests/                index.stories.tsx, index.test.tsx
      hooks/                use-<name>.ts
      <sub-name>/index.tsx  nested component
  pages/
    <route path>/page.tsx   route page, default export <Name>Page
      tests/                page.stories.tsx, page.test.tsx
      <name>/index.tsx      component used only by this page
  hooks/
    use-<name>.ts           camelCase export (useTheme)
    tests/use-<name>.test.ts
```

- `<sourceDir>/components/**`: kebab-case folders; component files are named
  `index.tsx`, except the flat `components/ui/` files; no component file sits
  directly in `components/`
- `<sourceDir>/pages/**`: kebab-case folders; a `.tsx` file is `page.tsx` or
  `index.tsx`
- `**/hooks/*`: hook files are kebab-case with a `use-` prefix (`use-*.ts`)
- `assets/`, `hooks/`, `state/`, `tests/`, and `utils/` are the reserved
  subfolders of a component or page folder; files in them are kebab-case
- `test/**`: test harness naming

`canonical/filename-match-exported` compares a component or page file's
default export against its kebab-case folder (`theme-switch/index.tsx` exports
`ThemeSwitch`). Outside `components/` and `pages/` it keeps exact matching, so
`i18n.ts` exports `i18n`. It is off for `pages/**/page.tsx`, stories, tests,
routes, and hook files.

For most non-GAIA layouts, passing `sourceDir` to the factory is enough:

```js
const lint = gaiaLint({sourceDir: 'src'});
```

If your project uses a different layout (for example, a non-GAIA project
that names component files in PascalCase, `Button.tsx`, instead of GAIA's
kebab-case folders with `index.tsx`), override the relevant `check-file/*` rules **after** the
`styleHygiene` spread:

```js
const lint = gaiaLint({sourceDir: 'src'});

export default defineConfig([
  ...lint.base,
  ...lint.styleHygiene,
  {
    files: ['src/components/**'],
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {'src/components/**/*.{ts,tsx}': 'PASCAL_CASE'},
      ],
    },
  },
]);
```

Or disable the GAIA `check-file` block entirely and reapply your own:

```js
{rules: {'check-file/folder-naming-convention': 'off'}}
```

## Versioning policy

This package follows SemVer.

- **Patch.** Plugin version bumps that do not change rule defaults, internal
  refactors, README fixes.
- **Minor.** New rules added, new options exposed on factories, new named
  exports, opt-in changes that do not break existing consumer configs.
- **Major.** Engine swaps (ESLint → Biome), `eslint` major version bumps,
  removal/rename of named exports, default-rule changes that introduce new
  errors in previously-clean code.

## Prereleases

3.0.0 ships first as `3.0.0-rc.N` on the `rc` dist-tag, for GAIA 2.0. Install
it with `pnpm add -D @gaia-react/lint@rc`. The `latest` dist-tag stays on 2.x
until GAIA 2.0.0 ships. The Release workflow publishes from `main` only, so a
2.x hotfix is cut and published manually by the maintainer from the
`release/2.x` branch.

## License

MIT
