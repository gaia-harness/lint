---
'@gaia-harness/lint': patch
---

Fixed: the react-doctor capability settings now list every version floor GAIA's stack satisfies (React Router 8, React 19.3, Tailwind 4, Zod 4, Base UI). The plugin matches these verbatim, so a react-doctor rule added to the config can no longer go silent for want of a floor. A test now fails if any enabled react-doctor rule requires a capability the list lacks.
