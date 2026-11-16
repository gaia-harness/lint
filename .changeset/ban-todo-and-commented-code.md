---
"@gaia-harness/lint": minor
---

Ban commented-out code and TODO/FIXME comments. `guardrails` turns `sonarjs/no-commented-code` on, and `styleHygiene` turns `no-warning-comments` on for a comment that opens with TODO or FIXME (prose that mentions the word mid-sentence passes) and `unicorn/expiring-todo-comments` off. Track unfinished work in an issue instead.

Moves to stylelint 18: the `stylelint` peer is now `^18.0.0`, with `stylelint-config-standard` 41, so `engines.node` follows stylelint 18 to `^22.22.2 || ^24.15.0 || >=26.0.0`. Upgrade stylelint, and Node if older, alongside this release. Also bumps the bundled ESLint plugins to their latest patch and minor versions.
