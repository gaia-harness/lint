---
'@gaia-harness/lint': patch
---

Check `unicorn/require-css-escape` inside the functions a Playwright spec
passes to `page.evaluate` and its siblings (`evaluateHandle`, `$eval`,
`$$eval`, `evaluateAll`, `waitForFunction`, `addInitScript`). Those run in
the browser, where `CSS.escape` exists, so an unescaped interpolated selector
there is flagged again; the rest of a spec stays exempt because it runs in
Node.
