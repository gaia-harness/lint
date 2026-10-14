---
"@gaia-react/lint": minor
---

Added: `react` reports Effects that should not be Effects (`react-you-might-not-need-an-effect`: state derived from other state or props, user-event logic in an Effect, chained updates, notifying a parent, resetting state on a prop change instead of using `key`). It also adds nine `@eslint-react` rules: an Effect that adds a listener, timer, interval, observer or fetch must clean it up, and React 19 forms replace `forwardRef`, `useContext` and `<Context.Provider>`.

Added: two opt-in arrays. `lint.i18n` reports raw JSX text that should come from `t()`; spread it only if the UI is translated. `lint.zod` turns on `eslint-plugin-zod`'s recommended rules for Zod 4 projects, minus `consistent-import`.

Changed: the `.length && <JSX/>` selector's comment now says that `sonarjs/jsx-no-leaked-render` already catches the general `count && <JSX/>` case.
