---
'@gaia-harness/lint': patch
---

Lint plain `.ts` and `.js` files faster. `react` now runs its JSX rules (`eslint-plugin-react`, `jsx-a11y`, the `@stylistic` JSX rules, `@eslint-react/no-context-provider` and the 40 react-doctor rules that read only JSX) on `.jsx` and `.tsx` files only, where they can report. `react-hooks`, `react-you-might-not-need-an-effect` and the Effect, render and hook rules from `@eslint-react` and react-doctor still run on every script file, so a hook in a `.ts` file is checked as before. The plugins stay registered everywhere. A `.jsx` or `.tsx` file reports the same errors as before.

`guardrails` turns `sonarjs/deprecation` off. `@typescript-eslint/no-deprecated` in `base` already reports every use of a `@deprecated` symbol, so each one was reported twice; the import line no longer gets a second report of its own.
