---
'@gaia-harness/lint': minor
---

Turn `unicorn/require-css-escape` off for `*.server` modules, and for any
files passed in the new `nodeFiles` option (for example a Vitest node
project's tests). That code runs in Node, where `CSS` is undefined, so the
rule's `CSS.escape` autofix crashed it.
