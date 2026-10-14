---
"@gaia-react/lint": minor
---

Added: four rule sets that close gaps in the bundle.

- `base` turns on the type-aware `@typescript-eslint/no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-argument`, `no-deprecated` and `no-unnecessary-type-conversion`, completing the `no-unsafe-*` family. Tests and stories keep the `no-unsafe-*` relaxation they already had.
- `base` adds `@eslint-community/eslint-comments`: every `eslint-disable` must give a reason after `--` (`// eslint-disable-next-line no-console -- startup banner`), a bare blanket `eslint-disable` is banned, and block disables must be paired with an enable unless they cover the whole file.
- `guardrails` adds `eslint-plugin-regexp`'s recommended set, which catches patterns that backtrack catastrophically (ReDoS), alternatives that can never match and needless escapes.
- `react` adds `react-refresh/only-export-components`, so a component module that also exports non-components, which breaks Fast Refresh, is reported. `reactRouter` allows React Router's route-module exports (`loader`, `action`, `meta`, ...) in route modules and `root.tsx`, and the `shadcn` vendored-ui exemption turns the rule off for registry files.

Action required on upgrade: add a `-- reason` to each `eslint-disable` that lacks one, and move any non-component export out of a component module.
