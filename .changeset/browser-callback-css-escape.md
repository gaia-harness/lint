---
'@gaia-harness/lint': patch
---

Check `unicorn/require-css-escape` inside the functions a Playwright spec
passes to `evaluate` and its sibling methods (`evaluateHandle`, `$eval`,
`$$eval`, `evaluateAll`, `waitForFunction`, `addInitScript`), on a page,
frame, locator or context. Those run in the browser, where `CSS.escape`
exists, so an unescaped interpolated selector there is flagged again; the
rest of a spec stays exempt because it runs in Node.
