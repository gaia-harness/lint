---
'@gaia-harness/lint': patch
---

Fixed: `unicorn/require-css-escape` is now off for `.playwright/**` files. Playwright specs run in Node, where `CSS` is undefined, so the rule's autofix turned a spec that queries parsed server HTML into one that throws `ReferenceError: CSS is not defined`. Browser code outside `.playwright/` keeps the rule.
