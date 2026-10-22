---
'@gaia-react/lint': patch
---

Fixed: every item in the shadcn registry now lints clean as `shadcn add` writes it. The vendored-ui rule list was built from a sample of registry items, so stock files outside that sample failed lint (`pnpm shadcn add pagination` tripped `jsx-a11y/anchor-has-content` on `PaginationLink`'s spread children). The list now comes from a sweep of `shadcn add --all` (shadcn 4.22.0) and adds the style rules and maintainer-sanctioned correctness rules that sweep found. `react-hooks/set-state-in-effect` and `better-tailwindcss/no-unknown-classes` are now off for vendored files; `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps` and `shadcn/no-raw-colors` stay on. The default `uiFiles` also covers the three helpers the registry writes outside `components/ui` (`hooks/use-mobile.ts`, `hooks/use-highlighted-code.ts`, `utils/highlighter.tsx`), while a project's own hooks and utils beside them stay fully linted.
