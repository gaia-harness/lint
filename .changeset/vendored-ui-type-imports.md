---
'@gaia-harness/lint': patch
---

Turn `@typescript-eslint/consistent-type-imports` off for vendored shadcn ui files. typescript-eslint 8.74 flags their `import * as React from "react"` when React is used only in type positions, and its autofix rewrote stock registry output.
