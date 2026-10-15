# @gaia-react/lint

## 3.0.0-rc.7

### Minor Changes

- [#70](https://github.com/gaia-react/lint/pull/70) [`751e0ed`](https://github.com/gaia-react/lint/commit/751e0ed82c604597385ca3c1c042feab8261e546) Thanks [@stevensacks](https://github.com/stevensacks)! - Changed: `shadcn` allows an arbitrary value where no scale step or token fits (`grid-cols-[auto_1fr]`, `bg-size-[200%_100%]`); `shadcn/no-arbitrary-values` is off. `betterTailwind` sets `rootFontSize: 16` on `enforce-canonical-classes`, so an arbitrary value that has a scale equivalent is rewritten to it (`w-[16px]` to `w-4`). Arbitrary colors stay banned through `better-tailwindcss/no-restricted-classes`, since every color is a theme role token; vendored ui files are exempt.

## 3.0.0-rc.6

### Patch Changes

- [#68](https://github.com/gaia-react/lint/pull/68) [`83a68aa`](https://github.com/gaia-react/lint/commit/83a68aaf80d3810947d0f3627f7039c380dd01f5) Thanks [@stevensacks](https://github.com/stevensacks)! - Updated: `@shadcn/lint` to 0.2.1, `eslint-plugin-better-tailwindcss` to 4.9.0, `eslint-plugin-playwright` to 2.12.1 and `stylelint-order` to 8.1.2, and refreshed the lockfile.

## 3.0.0-rc.5

### Minor Changes

- [#65](https://github.com/gaia-react/lint/pull/65) [`cd7d1d9`](https://github.com/gaia-react/lint/commit/cd7d1d907493d9e1185d7e341b84fdfce07a8c74) Thanks [@stevensacks](https://github.com/stevensacks)! - Added: four rule sets that close gaps in the bundle.

  - `base` turns on the type-aware `@typescript-eslint/no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-argument`, `no-deprecated` and `no-unnecessary-type-conversion`, completing the `no-unsafe-*` family. Tests and stories keep the `no-unsafe-*` relaxation they already had.
  - `base` adds `@eslint-community/eslint-comments`: every `eslint-disable` must give a reason after `--` (`// eslint-disable-next-line no-console -- startup banner`), a bare blanket `eslint-disable` is banned, and block disables must be paired with an enable unless they cover the whole file.
  - `guardrails` adds `eslint-plugin-regexp`'s recommended set, which catches patterns that backtrack catastrophically (ReDoS), alternatives that can never match and needless escapes.
  - `react` adds `react-refresh/only-export-components`, so a component module that also exports non-components, which breaks Fast Refresh, is reported. `reactRouter` allows React Router's route-module exports (`loader`, `action`, `meta`, ...) in route modules and `root.tsx`, and the `shadcn` vendored-ui exemption turns the rule off for registry files.

  Action required on upgrade: add a `-- reason` to each `eslint-disable` that lacks one, and move any non-component export out of a component module.

- [#66](https://github.com/gaia-react/lint/pull/66) [`8a1ecf4`](https://github.com/gaia-react/lint/commit/8a1ecf4ddcf11ae827c1676150792e0932672fe9) Thanks [@stevensacks](https://github.com/stevensacks)! - Added: `react` reports Effects that should not be Effects (`react-you-might-not-need-an-effect`: state derived from other state or props, user-event logic in an Effect, chained updates, notifying a parent, resetting state on a prop change instead of using `key`). It also adds nine `@eslint-react` rules: an Effect that adds a listener, timer, interval, observer or fetch must clean it up, and React 19 forms replace `forwardRef`, `useContext` and `<Context.Provider>`.

  Added: two opt-in arrays. `lint.i18n` reports raw JSX text that should come from `t()`; spread it only if the UI is translated. `lint.zod` turns on `eslint-plugin-zod`'s recommended rules for Zod 4 projects, minus `consistent-import`.

  Changed: the `.length && <JSX/>` selector's comment now says that `sonarjs/jsx-no-leaked-render` already catches the general `count && <JSX/>` case.

## 3.0.0-rc.4

### Minor Changes

- [#63](https://github.com/gaia-react/lint/pull/63) [`f58c5ff`](https://github.com/gaia-react/lint/commit/f58c5ffb8740a0a0589252349bf68b407dc0b5b1) Thanks [@stevensacks](https://github.com/stevensacks)! - Added: `reactRouter` now carries `no-imperative-query-fetch/no-imperative-query-fetch`, on by default for every TypeScript file under the source dir. It bans `ensureQueryData`, `fetchQuery`, `prefetchQuery` and their infinite variants, so a route has one fetch idiom: `queryClient.query` awaited in a clientLoader, read with `useSuspenseQuery`. `reactRouter` now follows `sourceDir`. Fix any reported call by moving the fetch into the clientLoader.

  Changed: `import-x/no-unresolved` ignores `^virtual:` imports, so Vite plugin virtual modules such as `virtual:msw` resolve, and checks case and CommonJS `require`. Under the source dir it now also covers `*.test.*` and `*.stories.*` files, where an unresolved import is the same defect. A project that carried a local `no-unresolved` override for either reason can delete it.

## 3.0.0-rc.3

### Major Changes

- [#61](https://github.com/gaia-react/lint/pull/61) [`1d66414`](https://github.com/gaia-react/lint/commit/1d6641435c3ea87c4c3d85319c04caae2c57cd1e) Thanks [@stevensacks](https://github.com/stevensacks)! - Removed: the `testing-library` block and the `eslint-plugin-testing-library` dependency. GAIA tests run in Vitest browser mode (`vitest-browser-react`, `page` locators), where Testing Library's rules no longer apply and `prefer-screen-queries` false-positives on `page.getByRole`. Delete any `eslint-disable` comments that name a `testing-library/*` rule. The jest-dom rules stay, because stories still assert with the jest-dom matchers that `storybook/test` re-exports.

### Patch Changes

- [#61](https://github.com/gaia-react/lint/pull/61) [`1d66414`](https://github.com/gaia-react/lint/commit/1d6641435c3ea87c4c3d85319c04caae2c57cd1e) Thanks [@stevensacks](https://github.com/stevensacks)! - Updated: `eslint-config-airbnb-extended` to 3.3.0, `eslint-plugin-sonarjs` to 4.2.2 and `eslint-plugin-storybook` to 10.6.1. Refreshed the lockfile, which picks up patched transitive releases and clears most `pnpm audit` advisories. The dependency release-age window drops from 7 days to 3, matching GAIA.

## 3.0.0-rc.2

### Patch Changes

- [#59](https://github.com/gaia-react/lint/pull/59) [`3f29c02`](https://github.com/gaia-react/lint/commit/3f29c02f0a8dcc2d357e1071294515d7c5f68fd9) Thanks [@stevensacks](https://github.com/stevensacks)! - Fixed: `@typescript-eslint/prefer-destructuring` is off in vendored shadcn ui files. shadcn's `toast` component re-exports namespace members as `const a = Namespace.a`, which the rule reported on unedited `shadcn add` output.

## 3.0.0-rc.1

### Major Changes

- [#56](https://github.com/gaia-react/lint/pull/56) [`9d48fbc`](https://github.com/gaia-react/lint/commit/9d48fbc94e9407cec9875aa51a862ced82518d28) Thanks [@stevensacks](https://github.com/stevensacks)! - Breaking: importing `FC` or `FunctionComponent` from `react` is now an error everywhere, including test and story files. Type props inline instead: `type ButtonProps = {...}; const Button = ({...}: ButtonProps) => ...`.

  Added: the opt-in `shadcn()` factory bundles `@shadcn/lint` (exact-pinned) so role tokens are the only color vocabulary. It sets `shadcn/no-raw-colors`, `shadcn/require-static-classes`, `shadcn/no-arbitrary-values` and `shadcn/no-inline-styles` to error, `shadcn/no-restyle` to error with `allow: ['layout']`, and `shadcn/no-unknown-classes` off in favor of better-tailwindcss's `no-unknown-classes`. Its vendored-ui block turns Prettier and the house-style rules off for `components/ui/*.tsx` (registry output stays byte-identical to `shadcn add`) while `shadcn/no-raw-colors`, `react-hooks/*` and the other correctness rules stay on, and `components/ui/tests/**` stays fully linted. Spread `...lint.shadcn({ui: '~/components/ui'})` as the last entry, after the full GAIA composition and `...lint.prettier`.

  The `eslint` peer floor rises from `^9.0.0` to `^9.30.0`, which `@shadcn/lint` requires. `@shadcn/lint` also pulls a dev-only copy of the `cn` package.

### Patch Changes

- [#57](https://github.com/gaia-react/lint/pull/57) [`c2e285f`](https://github.com/gaia-react/lint/commit/c2e285f4e228fd3261e0e1d775bb272ac1432366) Thanks [@stevensacks](https://github.com/stevensacks)! - Fixed: an unused `eslint-disable` directive now fails a plain `eslint` run at error severity (`linterOptions.reportUnusedDisableDirectives: 'error'`). The `eslint-comments/no-unused-disable` rule it replaces could never report, so the `@eslint-community/eslint-plugin-eslint-comments` dependency is removed. `unicorn/prefer-set-size` and `unicorn/no-blob-to-file` are now off: under the TypeScript parser they cannot report.

  Updated: minor and patch releases of `eslint-plugin-perfectionist`, `eslint-plugin-playwright`, `eslint-plugin-sonarjs`, `eslint-plugin-storybook` and `eslint-plugin-no-relative-import-paths`.

- [#56](https://github.com/gaia-react/lint/pull/56) [`9d48fbc`](https://github.com/gaia-react/lint/commit/9d48fbc94e9407cec9875aa51a862ced82518d28) Thanks [@stevensacks](https://github.com/stevensacks)! - Fixed: the stylelint config no longer reports every Tailwind `@apply` under `at-rule-prelude-no-invalid`. Stylelint 17's standard config validates at-rule preludes as CSS, and `@apply` takes utility class names, so the rule now ignores `@apply` and still checks every standard at-rule.

## 3.0.0-rc.0

### Major Changes

- [#54](https://github.com/gaia-react/lint/pull/54) [`fa0b343`](https://github.com/gaia-react/lint/commit/fa0b343b9504756f24591bf12df4d6ed27cb16ef) Thanks [@stevensacks](https://github.com/stevensacks)! - Breaking: the `styleHygiene` naming rules now enforce GAIA's kebab-case layout. Component and page folders are kebab-case, `components/ui/` holds flat kebab-case component files with `tests/` as its only subfolder, a route page is `pages/<path>/page.tsx` exporting `<Name>Page`, and hook files are `use-*.ts`. `canonical/filename-match-exported` applies a kebab transform to component and page `.tsx` files, so `theme-switch/index.tsx` exports `ThemeSwitch`; everywhere else it keeps exact matching. PascalCase component folders and camelCase hook files now fail lint, so rename them before upgrading.

## 2.3.0

### Minor Changes

- [#52](https://github.com/gaia-react/lint/pull/52) [`d1182f5`](https://github.com/gaia-react/lint/commit/d1182f5ef10d23399e2f18a265ba985cbdf24180) Thanks [@stevensacks](https://github.com/stevensacks)! - Add a `cn-conditional` guardrails rule that reports object arguments and ternaries with an empty branch (`undefined`, `null`, `false`, `''`) passed to `cn` from the `cn` package, so a conditional class is written as `cond && 'class'`. It keys on the `cn` import from `'cn'` and stays active in test and story files. Add `cn` to the Prettier config's `tailwindFunctions` so classes inside `cn(...)` sort like `twJoin` and `twMerge`, which stay in the list.

## 2.2.0

### Minor Changes

- [#47](https://github.com/gaia-react/lint/pull/47) [`8d222c6`](https://github.com/gaia-react/lint/commit/8d222c60fb6c0b68539abd834355a62553a5ab36) Thanks [@stevensacks](https://github.com/stevensacks)! - `guardrails`'s architecture-boundary carve-out now exempts flat `actions.*` and `resources.*` route files, matching `@react-router/fs-routes`'s dot-delimited naming. The older `actions+`/`resources+` group-folder spelling is still accepted, so projects on either layout keep passing without a config change.

## 2.1.0

### Minor Changes

- [#44](https://github.com/gaia-react/lint/pull/44) [`55856e4`](https://github.com/gaia-react/lint/commit/55856e4ac51e06256ef4e3efd532fec749dbf5c6) Thanks [@stevensacks](https://github.com/stevensacks)! - Refresh every bundled plugin that still supports the ESLint 9 line. No config authored here changes; the new rules arrive through `recommended` presets this config spreads.

  Twelve rules land at error severity that were not enabled before. Eleven come from `eslint-plugin-sonarjs` 4.1.0 → 4.2.0, whose `recommended` preset `guardrails` spreads wholesale: `assertions-in-test-cases`, `explicit-test-skip`, `memoize-cache-key`, `no-debug-commands-in-ui-tests`, `no-default-utility-imports`, `no-fixed-wait-in-tests`, `no-interpolation-in-inline-snapshots`, `no-mixed-completion-style`, `parameterized-tests`, `prefer-native-lodash-alternative`, and `synchronous-suite-callback`. The twelfth is `playwright/no-unnecessary-assertions`, added to `flat/recommended` in `eslint-plugin-playwright` 2.11.0 and therefore live under `.playwright/`. Despite the test-flavored names, the SonarJS rules ship in the base `recommended` set rather than a test-scoped one, so they resolve for every linted file, not only specs.

  `eslint-config-airbnb-extended` 3.1.0 → 3.2.0 only relaxes: `drizzle.config.*` joins the `import-x/no-extraneous-dependencies` devDependencies allowlist, so a Drizzle config importing a devDependency stops erroring.

  Consumers will see new lint errors on upgrade, though the count should be small and concentrated in test files; none of the twelve is auto-fixable, so each needs a real edit or a deliberate suppression. Measured against GAIA's own tree, the whole set produced three findings, all `sonarjs/parameterized-tests` flagging adjacent tests that differ only by input.

  Also refreshed, with no effective rule change: `@eslint/config-helpers`, `@vitest/eslint-plugin`, `eslint-plugin-better-tailwindcss`, `eslint-plugin-check-file`, `eslint-plugin-jest-dom`, `eslint-plugin-perfectionist`, `eslint-plugin-prefer-arrow-functions`, `eslint-plugin-storybook`, and `prettier-plugin-tailwindcss`.

  `eslint-plugin-storybook` 10.4.6 → 10.5.7 tightens its own peer on `storybook` to `^10.5.7`. A project on an earlier Storybook 10.5.x will see an unmet-peer warning until it bumps; the plugin's rules work regardless, and the warning is not fatal unless `strictPeerDependencies` is on.

  ESLint stays on the 9 line. `eslint` 10, `@eslint/js` 10, and `eslint-plugin-unicorn` 73 (which peers `eslint >=10.4`) all require widening the `eslint` peer range, so they belong to a major release rather than this one. TypeScript 7 is blocked independently: `typescript-eslint` 8.x peers `typescript <6.1.0`.

## 2.0.0

### Major Changes

- [#42](https://github.com/gaia-react/lint/pull/42) [`b364e99`](https://github.com/gaia-react/lint/commit/b364e995699dc4417637e19c79f91a958a3949b2) Thanks [@stevensacks](https://github.com/stevensacks)! - React Router relaxations move out of `react` into a new opt-in `reactRouter` block.

  `react` shipped a block scoped to `**/routes/**/*.tsx` that turned `no-empty-pattern` off. That glob is not unique to React Router: TanStack Router uses a `routes/` directory too, so a project on any other file-based router had the rule silently disabled across its whole route tree, with nothing in the composed config explaining why.

  The relaxation now ships as its own block. Spread it after `react` if you run React Router in framework mode:

  ```js
  ...lint.react,
  ...lint.reactRouter,
  ```

  **Breaking for React Router consumers.** Without that line, `no-empty-pattern` reports every route module that destructures nothing from its typed props (`({}: Route.ComponentProps)`). Adding the spread restores the previous behavior exactly; there is no other migration step. A project that never writes that shape sees no new errors either way, so the upgrade may well be a no-op in practice.

  Projects on another router should omit it and keep the rule enabled. They will most likely also want to ignore their generated route tree:

  ```js
  ...lint.ignores({extra: ['**/routeTree.gen.ts']}),
  ```

  The `/.react-router/**` glob stays in the `ignores` defaults. It names a directory that only exists in a React Router project, so it costs other projects nothing, while moving it would break React Router consumers who miss the new spread.

  A new suite asks ESLint what the composed config resolves to on both sides of the opt-in, so a future change that folds the block back into `react`, or widens its glob, fails a test instead of quietly relaxing a rule.

  Two dead config entries are removed in the same pass. Neither changes any effective rule:
  - `react/display-name` was set to `off` in the route block, but `airbnb/config/react` already sets it to `off` for every file.
  - The `typescript/only-throw-error` block disabled `@typescript-eslint/only-throw-error` for `hooks/`, `routes/`, and `sessions.server/`, but the `typescript/config` block already disables that rule globally for `**/*.ts?(x)`.

## 1.11.0

### Minor Changes

- [#40](https://github.com/gaia-react/lint/pull/40) [`1ed4f1b`](https://github.com/gaia-react/lint/commit/1ed4f1b20d64d45aa215f8465af2c8d14dcff7eb) Thanks [@stevensacks](https://github.com/stevensacks)! - Stop ignoring `.playwright` and `.storybook` by default, so the `playwright` and `storybook` blocks actually run.

  Both directories were bare entries in the `ignores` defaults. A config object carrying only `ignores` is a GLOBAL ignore in flat config, and a global ignore beats any later block's `files`, so the two blocks that scope themselves to those directories were shadowed by the defaults they shipped alongside. `playwright` scopes itself to `.playwright/**/*.ts?(x)` and never matched a file; `storybook` kept its `*.stories.*` rules (those live outside the directory) but its `.storybook/main.*` rules never ran. The composed config read as though the directories were covered, and `pnpm lint` reported zero problems for code nothing had checked.

  The defaults now name only generated output, non-source assets, and tool-owned script directories. A new `ignores` suite asks ESLint which paths survive the defaults, so a future directory-level entry that shadows a scoped block fails a test instead of shipping.

  `playwright/no-skipped-test` now runs with `allowConditional: true`. A bare `test.skip()` is a test switched off at author time and stays flagged; `test.skip(condition, reason)` is Playwright's own API for a test that does not apply to the environment it just found, and flagging it would fail lint on the conditional-skip pattern the recommended set never got to see while the block was inert.

  Consumers will see new lint errors on upgrade, in e2e specs and their helpers, in Storybook config and decorators, and in anything else living under those two directories. Most are auto-fixable with `--fix`. Real findings surface too: `playwright/expect-expect` and `playwright/no-conditional-in-test` have been configured but inert. To keep a directory exempt, pass it back explicitly:

  ```js
  ...lint.ignores({extra: ['.playwright', '.storybook']}),
  ```

## 1.10.0

### Minor Changes

- [#38](https://github.com/gaia-react/lint/pull/38) [`7bf6cec`](https://github.com/gaia-react/lint/commit/7bf6cec060655c1bd6044cc5d5f37ba366929ff4) Thanks [@stevensacks](https://github.com/stevensacks)! - Ban the bare `@conform-to/zod` import specifier via `no-restricted-imports` in the base config. The bare specifier targets Zod v3 and throws at RUNTIME — uncaught by typecheck, lint, and build — so a wrong import previously shipped silently and only failed in the running app. Import from `@conform-to/zod/v4` instead. The ban uses exact-match `paths`, so the distinct `@conform-to/zod/v4` specifier is unaffected; test and story files keep the ban alongside their existing server-only/`internals` import restrictions. Consumers with a bare `@conform-to/zod` import will see a new lint error on upgrade.

## 1.9.0

### Minor Changes

- [#36](https://github.com/gaia-react/lint/pull/36) [`fe262a6`](https://github.com/gaia-react/lint/commit/fe262a630e59913b138368161982c384678bad64) Thanks [@stevensacks](https://github.com/stevensacks)! - Add the `no-zod-enum` guardrail: `z.enum(...)` is now an `error` in `.ts`/`.tsx`. Use `z.literal([...])` for string unions (sort values alphanumerically). Report-only (no autofix), since `z.enum`'s `.enum`/`.options` accessors have no `z.literal` array equivalent and a rename can't sort. Consumers with existing `z.enum()` will see a new lint error on upgrade.

## 1.8.0

### Minor Changes

- [#34](https://github.com/gaia-react/lint/pull/34) [`e66f668`](https://github.com/gaia-react/lint/commit/e66f668a149ef2f3f8d867beeb06ef9df61b88d9) Thanks [@stevensacks](https://github.com/stevensacks)! - Add the `no-null-render` guardrail rule: standardize the empty render on `undefined` instead of `null`.

  In `.tsx`/`.jsx` files, a `return null` inside a function that provably renders JSX (it returns a JSX element elsewhere in the same scope) is now an `error` and is rewritten to `return undefined` by `--fix`. `null` and `undefined` are identical to React's reconciler (both, with `false`/`true`, are the same empty slot), so this is a consistency convention that standardizes on one of two equivalent forms, not a correctness or performance change.

  The autofix is deliberately conservative: it rewrites `return null` only when the enclosing function is provably a render function. A `return null` in a loader, action, or plain utility is never touched, so unsupervised `--fix` cannot change non-render runtime behavior. `: null` ternary arms stay out of scope (covered report-only by the existing `no-restricted-syntax` selectors).

  Wired into `guardrails`, scoped to `.tsx`/`.jsx`. A consumer with a `return null` in a render function will see a NEW auto-fixable lint error on upgrade.

  Also flag the most common numeric-`0` leak via `no-restricted-syntax`: a `.length && <JSX/>` conditional render. A `.length` left operand is always numeric, so `&&` leaks the literal `0` into the DOM when the list is empty; the fix is `items.length > 0 && <JSX/>`. This selector is report-only (no autofix) and has zero false positives. The general `count && <JSX/>` case is still not caught, because any expression could be numeric.

- [#34](https://github.com/gaia-react/lint/pull/34) [`e66f668`](https://github.com/gaia-react/lint/commit/e66f668a149ef2f3f8d867beeb06ef9df61b88d9) Thanks [@stevensacks](https://github.com/stevensacks)! - Refresh quarantined toolchain dependencies.
  - `eslint-plugin-sonarjs` 4.0.3 → 4.1.0. This is a runtime dependency whose recommended rules this config spreads, so consumers may see new SonarJS findings on upgrade. Most are auto-fixable; treat them as signal.
  - `typescript-eslint` 8.61.1 → 8.62.0. Held at 8.62.0 deliberately: 8.62.1 has not yet cleared the 7-day release-age quarantine, so 8.62.0 is the newest version that installs cleanly under a downstream release-age policy. A later release picks up 8.62.1 once it ages out.

  Both bumps have cleared the 7-day release-age quarantine, so each installs cleanly with no new release-age exclusions required.

## 1.7.0

### Minor Changes

- [#32](https://github.com/gaia-react/lint/pull/32) [`55bb692`](https://github.com/gaia-react/lint/commit/55bb6924fc90353f774dd9b7cf2b1b7d3042e8ba) Thanks [@stevensacks](https://github.com/stevensacks)! - Flag rendering `null` from a JSX ternary via `no-restricted-syntax`.

  `cond ? <JSX/> : null` and `cond ? null : <JSX/>` are now `error`-level. Both
  are the boolean-guarded `&&` render guard written the long way; use
  `cond && <JSX/>` instead (coerce a numeric/falsy guard with `!!cond` so the
  `0` value can't leak into the output).

  The selectors are flag-only, with no autofix: a blind `? : null` → `&&` rewrite
  is unsafe because numeric-`0` guards need `!!`, `??`-fed values need
  `: undefined`, and `||`-guards need per-operand coercion. A human applies the
  fix the selector points to.

  Both selectors only match a `JSXElement`/`JSXFragment` branch, so they are
  inert outside `.tsx`/`.jsx`. All `no-restricted-syntax` selectors are
  consolidated into one `gaia/no-restricted-syntax` config object, because ESLint
  flat config merges that rule key by replacement (last match wins), not
  concatenation.

  A consumer with a `cond ? <JSX/> : null` ternary will see a NEW lint failure on
  upgrade. That is the intent: convert it to `&&`.

## 1.6.0

### Minor Changes

- [#29](https://github.com/gaia-react/lint/pull/29) [`e7a2232`](https://github.com/gaia-react/lint/commit/e7a22321603248e5bf4790926677762581c0967c) Thanks [@stevensacks](https://github.com/stevensacks)! - Add two test-honesty lint rules and enforce error-only severity in the test config (no `warn`).
  - **`vitest/prefer-called-with` (error)** — a bare `toHaveBeenCalled()`/`toBeCalled()` proves a function ran but asserts nothing about arguments or count; require the `*With` form. Exempts the `.not` form.
  - **`no-restricted-imports` in test/story files (error)** — consumer test, story, and harness files may not import a server-only (`*.server`) or internal (`**/internals/**`) module; reach the behavior through the public interface instead. A dedicated `*.server.test.*` file is exempt (the right place to import a `.server` module). Covers static `import` / `export … from` only, not dynamic `import()`.
  - **`playwright/expect-expect` promoted `warn` → `error`** — a Playwright test that asserts nothing is a false green. Custom `expect*()` helpers still count via `assertFunctionPatterns`.

  Consumers on `--max-warnings=0` already treated the prior `warn` as blocking, so this only makes the intent explicit. Expect new errors on bare `toHaveBeenCalled()` and on server/internal imports from consumer tests — treat them as signal.

- [#28](https://github.com/gaia-react/lint/pull/28) [`b05f445`](https://github.com/gaia-react/lint/commit/b05f4459af8742f995c36e6fee67fa598ec53006) Thanks [@stevensacks](https://github.com/stevensacks)! - Refresh the quarantined toolchain dependencies.
  - `eslint-plugin-unicorn` 64 → 65. Held at 65 deliberately: unicorn 66 requires ESLint 10.4, and this config stays on ESLint 9 until that migration is coordinated with the consuming app. Unicorn 65 adds a large batch of rules to its `recommended` preset, which this config spreads, so consumers will see new unicorn findings on upgrade. Most are auto-fixable; treat them as signal.
  - `unicorn/prefer-includes-over-repeated-comparisons` is disabled. `Array#includes` returns a plain boolean, not a type predicate, so it cannot narrow a union the way an `===` comparison chain does. In a typed codebase the chain is the type-safe idiom; forcing `.includes()` discards the narrowing and the refined type of the value along with it. This joins the config's existing set of disabled unicorn opinions that fight idiomatic typed React.
  - `eslint-plugin-storybook` 10.4.2 → 10.4.6.
  - `@vitest/eslint-plugin` 1.6.19 → 1.6.20.
  - `eslint-plugin-better-tailwindcss` 4.5.0 → 4.6.0.
  - `eslint-plugin-perfectionist` 5.9.0 → 5.9.1.

  Every bump has cleared the 7-day release-age quarantine, so each installs cleanly under a downstream release-age policy with no new `trustPolicyExclude` entries.

- [#31](https://github.com/gaia-react/lint/pull/31) [`178157f`](https://github.com/gaia-react/lint/commit/178157f1bfb594953c2016bbe58f4b905b6d897e) Thanks [@stevensacks](https://github.com/stevensacks)! - Exempt typed `resources+`/`actions+` data endpoints from the `import-x/no-restricted-paths` architecture boundary. `no-restricted-paths` cannot distinguish a type-only import, so it flagged a UI component's `import type {action}` from a typed data endpoint (the `useFetcher<typeof action>` pattern). The UI layers (pages, components, hooks/state) now carry an `except` for `routes/{actions+,resources+}`; services, utils, and types are deliberately excluded so the carve-out stays within the UI layer.

## 1.5.1

### Patch Changes

- [#26](https://github.com/gaia-react/lint/pull/26) [`3206a92`](https://github.com/gaia-react/lint/commit/3206a92ec099eb7ddd4a296ec95a9ff27201fb2e) Thanks [@stevensacks](https://github.com/stevensacks)! - Bump `eslint-plugin-storybook` to 10.4.2.

  The package now adopts the same supply-chain hardening as the consuming app: a 7-day release-age quarantine (`minimumReleaseAge`) and pnpm `trustPolicy: no-downgrade`. Because the config can only ever pin dependencies that have already cleared the 7-day window, every published release installs cleanly under a downstream release-age policy with no per-dependency exclusions required.

## 1.5.0

### Minor Changes

- [#23](https://github.com/gaia-react/lint/pull/23) [`f6a26b9`](https://github.com/gaia-react/lint/commit/f6a26b9b4b4894def3cc04a96896cc8d5fce33a7) Thanks [@stevensacks](https://github.com/stevensacks)! - Enforce `@typescript-eslint/ban-ts-comment` at `error` in the `base` layer
  (previously explicitly `off`). `tsc` is the type oracle every consumer relies
  on, and `@ts-ignore` / `@ts-nocheck` silence its errors instead of fixing them,
  which is exactly the escape hatch an AI agent reaches for to turn red green.
  Closing it keeps the oracle honest.

  The rule is configured to ban the holes outright while keeping the good
  pattern:
  - `ts-ignore: true` — banned. `@ts-ignore` suppresses unconditionally and does
    nothing if the next line is already error-free, so it silently rots.
  - `ts-nocheck: true` — banned. Whole-file `@ts-nocheck` opts an entire module
    out of type checking.
  - `ts-expect-error: 'allow-with-description'` — kept. Unlike `@ts-ignore` it
    self-removes (errors) once the underlying type error disappears, so it can't
    go stale. A reason is now required.
  - `minimumDescriptionLength: 10` — the `@ts-expect-error` reason must be at
    least 10 characters, so "fix later" doesn't count.
  - `ts-check: false` — `@ts-check` opts _into_ stricter checking; no reason to
    restrict it.

  This is `error`-level and applies to all `.ts?(x)` files, including `.d.ts`
  (no exemption is baked into the shared config). A consumer with an existing
  `@ts-ignore`/`@ts-nocheck`, or an undescribed `@ts-expect-error`, will see a
  NEW lint failure on upgrade. That is the intent: replace each `@ts-ignore` with
  a described `@ts-expect-error`, or fix the underlying type error. Treat the hits
  as signal.

  Verified against the GAIA React reference app: zero spurious fires. The
  React Router typegen output (`.react-router/types/**`) is `.gitignore`-merged
  out of linting and carries no ts-comments, and the app's hand-written `.d.ts`
  is clean, so no consumer-side override is needed. Should a consumer's generated
  output ever emit ts-comments, scope the exemption in that consumer's own eslint
  config rather than weakening this shared rule.

## 1.4.0

### Minor Changes

- [#22](https://github.com/gaia-react/lint/pull/22) [`67be5dd`](https://github.com/gaia-react/lint/commit/67be5dd51b0bd47f86590138c332b66cd50aa079) Thanks [@stevensacks](https://github.com/stevensacks)! - Enable architecture-boundary enforcement. Turn on
  `import-x/no-restricted-paths` at `error` in the `guardrails` layer, scoped to
  the app non-test/story file set (`${sourceDir}/**/!(*.test|*.stories).ts?(x)`).
  No new dependency: `eslint-plugin-import-x` (v4.16.2) is already wired in, and
  airbnb-extended ships this rule `off`, which `guardrails` (spread after `base`)
  now overrides.

  It encodes GAIA's canonical `app/` layout and its import-direction invariant.
  Imports may only flow from a higher layer to a lower one; `types/` is a pure
  leaf importable by everyone:

  ```
  routes -> pages -> components -> { hooks, state } -> services -> utils -> types
  ```

  One zone per lower layer names the higher layers it must not import (collapsed
  with `from` arrays, supported in 4.16.2). Because `routes` is in every `from`
  set, nothing may import a route. `middleware`, `sessions.server`, `assets`,
  `languages`, and `styles` are intentionally left unconstrained.

  Zone `target`/`from` paths resolve against `process.cwd()` (the consuming
  project's root where eslint runs), not this package's location in
  node_modules, so `./${sourceDir}/...` correctly points at the consumer's source
  tree. No `basePath` override is needed. Verified by running eslint against the
  GAIA React reference app: the zones fire on `app/**` files and resolve the `~`
  alias against the consumer root.

  **Downstream impact (loud, but a minor by request):** this is `error`-level and
  catches `import type` as well as value imports, so a consumer whose code
  currently crosses a layer boundary will see a NEW lint failure on upgrade. It
  is not auto-fixable; each hit is a real wrong-direction edge to relocate or an
  inline `eslint-disable` to add deliberately. The reference app surfaced exactly
  one edge across all of `app/`: a component importing a resource-route `action`
  type for `useFetcher<typeof action>()`. Treat such hits as signal, not noise.
  If a consumer relies on resource routes as a typed data-endpoint layer, relax
  only the `components` -> `routes` reach with the rule's `except` option rather
  than downgrading the rule.

- [#20](https://github.com/gaia-react/lint/pull/20) [`056d935`](https://github.com/gaia-react/lint/commit/056d935c63ae57cb9ddc0c119b2802a102680a40) Thanks [@stevensacks](https://github.com/stevensacks)! - Harden the `testing` config with test-discipline rules beyond the
  `@vitest/eslint-plugin` `recommended` preset (all verified against plugin
  v1.6.19). These complement a mechanical TDD RED-verification gate by closing
  test-integrity gaps the gate cannot see on its own.

  Added (error):
  - `consistent-test-it` `{fn: 'test'}` — forbid mixing `test()`/`it()`; GAIA
    uses `test()` exclusively. `fn` cascades to within-describe in 1.6.19.
  - `consistent-vitest-vi` `{fn: 'vi'}` — forbid mixing the `vitest`/`vi` mock
    API; GAIA uses `vi`.
  - `no-test-return-statement` — a returned value/promise can resolve after the
    test "passes", faking GREEN.
  - `no-conditional-in-test` — a branch in a test body can assert nothing on one
    path. (Only this one; `no-conditional-tests` is a byte-identical duplicate.)
  - `no-test-prefixes` — forbid `fdescribe`/`fit`/`xdescribe`/`xit`, which bypass
    the active `no-focused-tests` / `no-disabled-tests` rules.
  - `prefer-todo` — push empty `test('...')` stubs to `test.todo('...')` so
    unimplemented tests are explicit, not silently passing. (Not `warn-todo`,
    which contradicts it.)
  - `require-to-throw-message` — a bare `.toThrow()` passes on any throw; require
    an asserted message or matcher.

  Changed (baseline bump):
  - `no-disabled-tests` `warn` -> `error` — `.skip` is the biggest gaming vector
    for a RED-verification gate. Park work with `test.todo` or an inline
    `eslint-disable`, not a silent `.skip`.

  Downstream impact: these are `error`-level, so projects with existing
  violations may see new lint failures. Most additions are auto-fixable
  (`eslint --fix`); `no-disabled-tests` and `require-to-throw-message` are not.
  Verified zero spurious fires across GAIA's 44 test/story files.

## 1.3.1

### Patch Changes

- [#18](https://github.com/gaia-react/lint/pull/18) [`b25bcfb`](https://github.com/gaia-react/lint/commit/b25bcfb1c204846b53cbf271c674346f329f1b4c) Thanks [@stevensacks](https://github.com/stevensacks)! - Update toolchain dependencies and resolve security advisories.
  - Bump `stylelint-config-clean-order` 8 → 10 (CSS property-ordering updates: logical `inset` properties now sort before their physical equivalents; typography properties repositioned — no API or option changes)
  - Patch-bump `eslint-plugin-prettier`, `@vitest/eslint-plugin`, and `@eslint-community/eslint-plugin-eslint-comments`
  - Resolve transitive advisories: `brace-expansion` → 5.0.6 (GHSA-jxxr-4gwj-5jf2), `fast-uri` → 3.1.2 (GHSA-q3j6-qgpj-74h6, GHSA-v39h-62p7-jpjc)

## 1.3.0

### Minor Changes

- [#15](https://github.com/gaia-react/lint/pull/15) [`6572309`](https://github.com/gaia-react/lint/commit/657230928bb6dc1e5cab9a2d0014356a2a035db1) Thanks [@stevensacks](https://github.com/stevensacks)! - Convert the default export to a `gaiaLint(opts?)` factory. Accepts a
  `sourceDir` option (default `'app'`) that scopes filename conventions,
  hook-folder rules, and `no-relative-import-paths` to the consumer's
  source root — so projects using `src/` (or any other layout) can drop
  in `gaiaLint({sourceDir: 'src'})` without per-rule overrides.

  `includeIgnoreFile` is now imported from `@eslint/config-helpers`
  instead of the deprecated re-export in `@eslint/compat`. `@eslint/compat`
  has been dropped as a dependency.

  `ignores` is now dual-shape: spread it directly for the default case
  (`...lint.ignores`) — `.gitignore` is auto-detected and silently
  no-ops if the resolved path doesn't exist — or call it with options to
  override (`...lint.ignores({extra: ['.gaia/**']})`). Pass
  `{gitignore: false}` to opt out of the gitignore merge entirely, or
  `{gitignore: 'path/...'}` for a non-standard location.

  **Breaking:** the named static config exports (`base`, `react`,
  `styleHygiene`, `guardrails`, `testing`, `storybook`, `playwright`,
  `prettier`, `betterTailwind`, `ignores`) are gone. Access them off the
  bundle returned by the factory:

  ```diff
  - import gaiaLint from '@gaia-react/lint';
  + import gaiaLint from '@gaia-react/lint';
  + const lint = gaiaLint();

    export default defineConfig([
  -   ...gaiaLint.ignores({gitignore: '.gitignore'}),
  -   ...gaiaLint.base,
  -   ...gaiaLint.react,
  +   ...lint.ignores,
  +   ...lint.base,
  +   ...lint.react,
      // ...
    ]);
  ```

### Patch Changes

- [#15](https://github.com/gaia-react/lint/pull/15) [`6572309`](https://github.com/gaia-react/lint/commit/657230928bb6dc1e5cab9a2d0014356a2a035db1) Thanks [@stevensacks](https://github.com/stevensacks)! - Bump `@vitest/eslint-plugin` to 1.6.18 and `typescript-eslint` to 8.60.0.
  No rule-default changes.

## 1.2.0

### Minor Changes

- [#12](https://github.com/gaia-react/lint/pull/12) [`6417611`](https://github.com/gaia-react/lint/commit/641761133e254a50c6b6a42ba5896b7a3eec0bcd) Thanks [@stevensacks](https://github.com/stevensacks)! - Add `no-jsx-iife` rule to `gaiaLint.guardrails`.

  Flags IIFEs (`{(() => { ... })()}`) used inside JSX expression containers. These obscure intent and allocate a new function on every render. The rule errors on both arrow-function and regular-function callees inside a `JSXExpressionContainer`, scoped to `**/*.tsx` and `**/*.jsx` files. Fix by computing the value in a variable before the return statement, using an inline `&&` expression, or extracting a sub-component.

## 1.1.3

### Patch Changes

- [#10](https://github.com/gaia-react/lint/pull/10) [`1c87c49`](https://github.com/gaia-react/lint/commit/1c87c49b35eaf021e1dac5d916bbb16ef0c5da2c) Thanks [@stevensacks](https://github.com/stevensacks)! - Fix `gaiaLint.testing` files glob and configure `expect-expect` rules to recognize `expect*` helpers.

  **Glob fix.** The vitest block was scoped to `['*.test.ts?(x)', '*.stories.ts?(x)', 'test/**/*.ts?(x)']` — the first two patterns lack the `**/` prefix needed to match nested paths in ESLint flat config, so none of the vitest, jest-dom, or `import-x/no-useless-path-segments` rules fired on files like `app/components/Button/tests/index.test.tsx`. Verified via `eslint --print-config` against a nested test: `vitest/*` and `jest-dom/*` rules were absent from the effective config; the no-useless-path rule resolved to severity 0 (off, inherited from base) instead of error. Sibling `testing-library` block was unaffected (already correctly scoped to `['**/*.test.ts?(x)']`).

  **Helper-aware `expect-expect`.** Once the glob is fixed, `vitest/expect-expect` (severity error) starts flagging tests that delegate their assertion to a helper — e.g. `await expectNoA11yViolations(container)`, where the `expect()` call lives inside the helper. Same pattern surfaces for `playwright/expect-expect` against `expectNoSeriousA11yViolations(page)`. Both rules now whitelist functions matching `/^expect[A-Z]/`, so any `expect*` helper following the project's naming convention satisfies the rule without per-test disable directives.

  Effect after upgrading: `pnpm lint --fix` rewrites `import X from '../index'` → `import X from '..'` for every component test, previously-silent vitest/jest-dom rule violations on nested tests start surfacing, and a11y/e2e helpers that internally assert no longer trip `expect-expect`.

## 1.1.2

### Patch Changes

- [#8](https://github.com/gaia-react/lint/pull/8) [`2f5a18d`](https://github.com/gaia-react/lint/commit/2f5a18d1e69f830e69ce70dccf1545e45a22ac1a) Thanks [@stevensacks](https://github.com/stevensacks)! - Enable `import-x/no-useless-path-segments` with `noUselessIndex: true` in the testing config.

  Auto-rewrites `import X from '../index'` → `import X from '..'` on `pnpm lint --fix` for `*.test.ts?(x)`, `*.stories.ts?(x)`, and `test/**/*.ts?(x)`. Aligns with GAIA's `Component/index.tsx` + `Component/tests/index.test.tsx` convention where sibling-index imports are intentional. Globally scoped `import-x/no-useless-path-segments` remains off in the base config.

## 1.1.1

### Patch Changes

- [#6](https://github.com/gaia-react/lint/pull/6) [`efebb80`](https://github.com/gaia-react/lint/commit/efebb803e690076133ab1c0c9f9ab5adb8ee9cd4) Thanks [@stevensacks](https://github.com/stevensacks)! - Close `prefer-arrow-functions` upstream gap for `export default function NamedFn(){}` via `no-restricted-syntax` selector.

  The `eslint-plugin-prefer-arrow-functions` plugin has a hardcoded exemption (`guard.js:hasNameAndIsExportedAsDefaultExport`) that silently passes named default-exported declarations regardless of `allowNamedFunctions` setting. This release adds a `no-restricted-syntax` rule with selector `ExportDefaultDeclaration > FunctionDeclaration` to flag the pattern. Convert to `const Name = () => {}; export default Name;` instead. Ignored on `**/*.d.ts` since ambient declarations have no body to convert.

## 1.1.0

### Minor Changes

- [`ebad2d3`](https://github.com/gaia-react/lint/commit/ebad2d32c55656ea7a29bf764eaf536db4ccef81) Thanks [@stevensacks](https://github.com/stevensacks)! - Add Prettier and Stylelint config subpath exports.
  - `@gaia-react/lint/prettier` — Prettier engine config (singleQuote, no bracket spacing, ES5 trailing commas, experimental ternaries, Tailwind class-sorting via `prettier-plugin-tailwindcss` for `twJoin`/`twMerge`).
  - `@gaia-react/lint/stylelint` — Stylelint config extending `stylelint-config-standard` + `stylelint-config-clean-order` + `stylelint-config-tailwindcss`, with `stylelint-order` plugin and GAIA-specific overrides for CSS modules.

  Consumer usage:

  ```js
  // prettier.config.mjs
  export {default} from '@gaia-react/lint/prettier';

  // stylelint.config.mjs
  export {default} from '@gaia-react/lint/stylelint';
  ```

  `stylelint` joins `eslint`/`prettier`/`typescript` as a peer dependency (optional; only required if you import the stylelint subpath).
