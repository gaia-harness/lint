---
'@gaia-harness/lint': patch
---

Turn `unicorn/require-css-escape` off for files inside a `.server`
directory (React Router's server-only module convention), not only
`*.server` files. That code runs in Node, where `CSS` is undefined, so the
rule's `CSS.escape` autofix crashed it.
