---
"@gaia-react/lint": minor
---

Added: `reactRouter` now carries `no-imperative-query-fetch/no-imperative-query-fetch`, on by default for every TypeScript file under the source dir. It bans `ensureQueryData`, `fetchQuery`, `prefetchQuery` and their infinite variants, so a route has one fetch idiom: `queryClient.query` awaited in a clientLoader, read with `useSuspenseQuery`. `reactRouter` now follows `sourceDir`. Fix any reported call by moving the fetch into the clientLoader.

Changed: `import-x/no-unresolved` ignores `^virtual:` imports, so Vite plugin virtual modules such as `virtual:msw` resolve, and checks case and CommonJS `require`. Under the source dir it now also covers `*.test.*` and `*.stories.*` files, where an unresolved import is the same defect. A project that carried a local `no-unresolved` override for either reason can delete it.
