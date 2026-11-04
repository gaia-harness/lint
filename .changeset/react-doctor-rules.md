---
'@gaia-harness/lint': minor
---

Added: 125 curated rules from `eslint-plugin-react-doctor`, pinned to exactly 0.9.21, chosen one by one with no preset. They catch defect classes the bundle missed:
- SSR and hydration hazards from browser globals;
- React Router framework-mode mistakes in loaders, actions, middleware, sessions, cookies, search params, navigation and error UI;
- invalid HTML nesting, and accessibility jsx-a11y misses;
- side effects in render and state updaters;
- Effect teardown and async races;
- render-path performance;
- reduced motion and font scaling;
- shadcn composition;
- defensive-JS and security classes such as auth tokens in web storage and unescaped dynamic `RegExp` input.

`no-giant-component` (over 300 lines) and `no-high-complexity-react-function` (over 15 cyclomatic or cognitive complexity) measure only components and hooks. They stand in for the sonarjs size and complexity rules, which stay off. `reactRouter` sets the `react-doctor` capability settings the router rules need to recognize route modules. See "react-doctor rules" in the README.

Added: `@tanstack/eslint-plugin-query`, pinned to exactly 5.105.0, with its recommended rules in `reactRouter`'s Query block beside `no-imperative-query-fetch`. They match TanStack Query imports, so a project without Query sees nothing. In the object passed straight to `useMutation`, `perfectionist/sort-objects` keeps natural order but sorts `onError` and `onSettled` last. In the object passed to `useInfiniteQuery`, `useSuspenseInfiniteQuery` and `infiniteQueryOptions`, it sorts `getNextPageParam` and `getPreviousPageParam` last. Its autofix therefore produces the order the TanStack property-order rules require.

Changed: `react/jsx-key` is back on (error), because Airbnb's non-strict React config turns it off and nothing else caught a list rendered without `key`.

Updated dependencies: `eslint-plugin-react-you-might-not-need-an-effect` 1.0.3, `eslint-plugin-regexp` 3.3.2 and `eslint-plugin-storybook` 10.6.5.

Adopters will likely see new findings on upgrade, including errors: `react/jsx-key`, 26 react-doctor rules and six TanStack rules report at error severity.
