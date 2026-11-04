import reactDoctor from 'eslint-plugin-react-doctor';
import type {ESLint, Linter} from 'eslint';

/**
 * The one `eslint-plugin-react-doctor` registration every block that names a
 * `react-doctor/*` rule spreads into its `plugins`. Flat config accepts the
 * same plugin object in several blocks, so `react`, `reactRouter`, `shadcn()`
 * and `guardrails` each stay self-contained without a redefinition error.
 *
 * Curated rules only, never a preset: the presets re-enable rules GAIA turns
 * off on purpose and carry hundreds of rules for libraries GAIA does not use.
 * The rules take no options, carry no autofix and need no type information,
 * so the same rule ids port unchanged to Oxlint's `oxlint-plugin-react-doctor`.
 *
 * The package is pinned to an exact version. The rule set churns between
 * releases, and ESLint fails a config that names a rule the installed plugin
 * no longer ships, so a bump is a deliberate change with its tests. Every
 * curated rule id lives in this file, grouped by the block that applies it,
 * so a bump is checked against one list.
 */
export const REACT_DOCTOR_PLUGINS: Record<string, ESLint.Plugin> = {
  'react-doctor': reactDoctor as unknown as ESLint.Plugin,
};

/** `react`: browser globals in render or a state initializer break SSR. */
const SSR_RULES: Linter.RulesRecord = {
  'react-doctor/no-hydration-branch-on-browser-global': 'error',
  'react-doctor/no-locale-format-in-render': 'warn',
  'react-doctor/no-match-media-in-state-initializer': 'warn',
  'react-doctor/no-unguarded-browser-global-in-render-or-hook-init': 'error',
};

/** `react`: markup the browser repairs or rejects, which breaks hydration. */
const HTML_RULES: Linter.RulesRecord = {
  'react-doctor/form-control-requires-name': 'warn',
  'react-doctor/html-no-invalid-paragraph-child': 'warn',
  'react-doctor/html-no-invalid-table-nesting': 'warn',
  'react-doctor/html-no-nested-form': 'warn',
  'react-doctor/html-no-nested-interactive': 'warn',
  'react-doctor/no-inert-sticky-position': 'warn',
};

/**
 * `react`: accessible names, landmarks, headings, roles, hover-only content
 * and form semantics jsx-a11y misses.
 */
const A11Y_RULES: Linter.RulesRecord = {
  'react-doctor/data-table-requires-accessible-name': 'warn',
  'react-doctor/details-requires-summary': 'warn',
  'react-doctor/dialog-has-accessible-name': 'warn',
  'react-doctor/empty-table-header': 'warn',
  'react-doctor/fieldset-requires-legend': 'warn',
  'react-doctor/html-label-has-single-control': 'warn',
  'react-doctor/no-aria-invalid-without-description': 'warn',
  'react-doctor/no-assertive-status': 'warn',
  'react-doctor/no-autoplay-without-muted': 'warn',
  'react-doctor/no-blocked-paste': 'error',
  'react-doctor/no-disabled-zoom': 'error',
  'react-doctor/no-duplicate-static-id-reference': 'error',
  'react-doctor/no-focusable-content-in-aria-hidden': 'warn',
  'react-doctor/no-hover-only-reveal': 'warn',
  'react-doctor/no-invalid-progress-range': 'error',
  'react-doctor/no-multiple-main-landmarks': 'warn',
  'react-doctor/no-multiple-unlabeled-navigation-landmarks': 'warn',
  'react-doctor/no-placeholder-only-field': 'warn',
  'react-doctor/no-presentation-role-conflict': 'warn',
  'react-doctor/no-responsive-hidden-accessible-name': 'warn',
  'react-doctor/no-skipped-heading-level': 'warn',
  'react-doctor/no-uninformative-aria-label': 'warn',
  'react-doctor/radio-input-missing-name': 'warn',
  'react-doctor/role-button-requires-complete-keyboard-activation': 'warn',
};

/**
 * `react`: side effects and identity bugs in render and state updates that the
 * React Compiler rules in `react-hooks` do not model.
 */
const RENDER_STATE_RULES: Linter.RulesRecord = {
  'react-doctor/no-call-component-as-function': 'warn',
  'react-doctor/no-controlled-input-value-without-state-update': 'warn',
  'react-doctor/no-create-context-in-render': 'error',
  'react-doctor/no-create-ref-in-function-component': 'warn',
  'react-doctor/no-default-props': 'warn',
  'react-doctor/no-impure-call-at-module-scope': 'warn',
  'react-doctor/no-indeterminate-attribute': 'warn',
  'react-doctor/no-mutate-queried-dom-node-in-component': 'warn',
  'react-doctor/no-mutating-reducer-state': 'error',
  'react-doctor/no-nondeterministic-id-value-in-render-body': 'warn',
  'react-doctor/no-prop-callback-in-render': 'error',
  'react-doctor/no-side-effect-in-state-updater-function': 'warn',
  'react-doctor/no-uncontrolled-input': 'warn',
  'react-doctor/rerender-functional-setstate': 'warn',
  'react-doctor/waapi-animation-in-render': 'error',
};

/**
 * `react`: fetch and async work in Effects, and teardown the `@eslint-react`
 * leak rules do not cover (animation frames, object URLs, debounces, pointer
 * capture, stale timer refs, async races).
 */
const EFFECT_RULES: Linter.RulesRecord = {
  'react-doctor/debounce-no-cleanup': 'warn',
  'react-doctor/effect-raf-loop-needs-cancel': 'warn',
  'react-doctor/no-create-object-url-without-revoke': 'warn',
  'react-doctor/no-fetch-in-effect': 'warn',
  'react-doctor/no-fetch-response-used-without-status-check': 'warn',
  'react-doctor/no-loading-flag-reset-outside-finally': 'warn',
  'react-doctor/no-promise-then-side-effect-in-effect-without-catch': 'warn',
  'react-doctor/no-set-state-after-await-in-effect': 'warn',
  'react-doctor/no-stale-timer-ref': 'warn',
  'react-doctor/no-unbounded-animation-frame-loop': 'warn',
  'react-doctor/no-unowned-async-error-clear': 'warn',
  'react-doctor/pointer-capture-needs-cancel-handler': 'warn',
};

/**
 * `react`: sequential independent awaits, work repeated every render or call,
 * and image and script loading.
 */
const PERFORMANCE_RULES: Linter.RulesRecord = {
  'react-doctor/async-parallel': 'warn',
  'react-doctor/js-hoist-intl': 'warn',
  'react-doctor/no-eager-new-in-use-state-initializer': 'warn',
  'react-doctor/no-img-lazy-with-high-fetchpriority': 'warn',
  'react-doctor/no-img-without-dimensions': 'warn',
  'react-doctor/no-mixed-srcset-descriptors': 'warn',
  'react-doctor/no-spread-accumulator-in-reduce': 'warn',
  'react-doctor/no-srcset-without-sizes': 'warn',
  'react-doctor/rendering-script-defer-async': 'warn',
  'react-doctor/rerender-lazy-ref-init': 'warn',
  'react-doctor/rerender-lazy-state-init': 'warn',
};

/**
 * `react`: motion that ignores reduced-motion and pixel font sizes that ignore
 * user font scaling. Off in vendored shadcn ui (see `shadcn.ts`).
 */
export const MOTION_FONT_RULES: Linter.RulesRecord = {
  'react-doctor/no-arbitrary-px-font-size': 'warn',
  'react-doctor/no-smooth-scroll-without-reduced-motion': 'warn',
  'react-doctor/no-ungated-tailwind-animation': 'warn',
};

/**
 * `react`: size and complexity measured only on components and `use*` hooks
 * (over 300 lines; cyclomatic or cognitive complexity over 15; both fixed
 * upstream). They stand in for the sonarjs size and complexity rules, which
 * stay off because they do not model components and hooks.
 */
const SIZE_RULES: Linter.RulesRecord = {
  'react-doctor/no-giant-component': 'warn',
  'react-doctor/no-high-complexity-react-function': 'warn',
};

export const REACT_DOCTOR_REACT_RULES: Linter.RulesRecord = {
  ...SSR_RULES,
  ...HTML_RULES,
  ...A11Y_RULES,
  ...RENDER_STATE_RULES,
  ...EFFECT_RULES,
  ...PERFORMANCE_RULES,
  ...MOTION_FONT_RULES,
  ...SIZE_RULES,
};

/**
 * `reactRouter`: framework-mode mistakes in loaders, actions, middleware,
 * sessions, cookies, search params, navigation and the server entry.
 */
export const REACT_DOCTOR_REACT_ROUTER_RULES: Linter.RulesRecord = {
  'react-doctor/react-router-csp-nonce-consistency': 'error',
  'react-doctor/react-router-guard-aborted-handle-error': 'warn',
  'react-doctor/react-router-internal-route-anchor': 'warn',
  'react-doctor/react-router-loader-fetch-forwards-signal': 'warn',
  'react-doctor/react-router-loader-parallel-fetch': 'warn',
  'react-doctor/react-router-no-catch-middleware-next': 'warn',
  'react-doctor/react-router-no-client-module-in-server-render': 'error',
  'react-doctor/react-router-no-loader-request-body': 'error',
  'react-doctor/react-router-no-middleware-response-body-consumption': 'warn',
  'react-doctor/react-router-no-multiple-blockers': 'error',
  'react-doctor/react-router-no-multiple-middleware-next': 'error',
  'react-doctor/react-router-no-multiple-set-search-params-in-tick': 'warn',
  'react-doctor/react-router-no-navigate-in-render': 'error',
  'react-doctor/react-router-no-redirect-in-try-catch': 'error',
  'react-doctor/react-router-no-route-module-environment-suffix': 'error',
  'react-doctor/react-router-no-session-mutation-in-loader': 'error',
  'react-doctor/react-router-no-static-cookie-expires': 'error',
  'react-doctor/react-router-no-unsynchronized-search-params-mutation': 'error',
  'react-doctor/react-router-no-use-loader-data-in-error-ui': 'error',
  'react-doctor/react-router-require-root-error-boundary': 'error',
  'react-doctor/react-router-resource-link-requires-reload': 'error',
  'react-doctor/react-router-return-navigation-promise-in-transition': 'warn',
  'react-doctor/react-router-server-middleware-return-response': 'error',
  'react-doctor/react-router-session-mutation-requires-commit': 'error',
};

/**
 * `reactRouter`, in the Query block: TanStack Query misuse the official
 * plugin does not check. Its `no-rest-destructuring`, `stable-query-client`
 * and `no-void-query-fn` own those cases, so react-doctor's copies stay off.
 */
export const REACT_DOCTOR_QUERY_RULES: Linter.RulesRecord = {
  'react-doctor/query-destructure-result': 'warn',
  'react-doctor/query-mutation-missing-invalidation': 'warn',
  'react-doctor/query-no-mutation-in-effect-as-read': 'warn',
  'react-doctor/query-no-query-in-effect': 'warn',
  'react-doctor/query-no-usequery-for-mutation': 'warn',
};

/** `reactRouter`: source modules only; a module-scope browser global crashes SSR. */
export const REACT_DOCTOR_MODULE_SCOPE_RULES: Linter.RulesRecord = {
  'react-doctor/no-unguarded-browser-global-at-module-scope': 'warn',
};

/** `guardrails`: security and defensive-JS classes sonarjs and regexp miss. */
export const REACT_DOCTOR_GUARDRAIL_RULES: Linter.RulesRecord = {
  'react-doctor/auth-token-in-web-storage': 'warn',
  'react-doctor/no-document-write': 'warn',
  'react-doctor/no-fill-map-element-as-key': 'warn',
  'react-doctor/no-non-literal-selector-query-without-try-catch': 'warn',
  'react-doctor/no-non-null-assertion-on-maybe-undefined-result': 'warn',
  'react-doctor/no-nullish-coalescing-arithmetic-precedence': 'warn',
  'react-doctor/no-path-prefix-containment': 'warn',
  'react-doctor/no-secrets-in-client-code': 'warn',
  'react-doctor/no-sync-xhr': 'warn',
  'react-doctor/no-unescaped-dynamic-string-in-regexp': 'warn',
  'react-doctor/no-unguarded-numeric-input-parse': 'warn',
  'react-doctor/no-unguarded-throwing-parse-call': 'warn',
  'react-doctor/no-whole-object-default-losing-per-key-defaults': 'warn',
  'react-doctor/window-open-without-noopener': 'warn',
};

/**
 * `shadcn()`: composition that breaks a shadcn primitive's accessible name,
 * keyboard model or structure. Off in vendored ui, which defines the
 * primitives these check.
 */
export const REACT_DOCTOR_SHADCN_RULES: Linter.RulesRecord = {
  'react-doctor/shadcn-dialog-content-requires-title': 'warn',
  'react-doctor/shadcn-icon-button-requires-label': 'warn',
  'react-doctor/shadcn-input-group-no-raw-controls': 'warn',
  'react-doctor/shadcn-tabs-trigger-requires-list': 'warn',
};

/**
 * The capabilities `reactRouter` declares in `settings['react-doctor']`.
 * react-doctor's CLI detects them per project; the standalone plugin reads
 * them from settings. Without `react-router-framework` the react-router rules
 * never recognize a route module's named `loader`, `action` or
 * `ErrorBoundary` exports and report nothing. Once the list is set, a rule
 * runs only when every capability it `requires` appears verbatim (a version
 * entry such as `react-router:7.9` is a floor, not a range), so this names
 * each capability the curated rules require that a React Router
 * framework-mode project on React 19 and Tailwind has. `shadcn` and
 * `tanstack-query` are listed too: their rules match the components and hooks
 * they check by import, so they stay silent in a project without them.
 */
export const REACT_DOCTOR_CAPABILITIES = [
  'react',
  'react:19',
  'react-router',
  'react-router:6.4',
  'react-router:6.7',
  'react-router:7',
  'react-router:7.8',
  'react-router:7.9',
  'react-router:7.10',
  'react-router-framework',
  'shadcn',
  'ssr',
  'tailwind',
  'tanstack-query',
];
