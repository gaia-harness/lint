---
'@gaia-harness/lint': patch
---

Fix the `@gaia-harness/lint/prettier` config failing in pnpm projects with `Cannot find package 'prettier-plugin-tailwindcss'`: the Tailwind plugin now resolves from this package, so consumers need no dependency of their own on it. Add a `prettierConfig({tailwind})` factory so a project with no UI can drop the plugin and its options with `tailwind: false`; the default export is unchanged.
