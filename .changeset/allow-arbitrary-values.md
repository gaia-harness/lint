---
"@gaia-react/lint": minor
---

Changed: `shadcn` allows an arbitrary value where no scale step or token fits (`grid-cols-[auto_1fr]`, `bg-size-[200%_100%]`); `shadcn/no-arbitrary-values` is off. `betterTailwind` sets `rootFontSize: 16` on `enforce-canonical-classes`, so an arbitrary value that has a scale equivalent is rewritten to it (`w-[16px]` to `w-4`). Arbitrary colors stay banned through `better-tailwindcss/no-restricted-classes`, since every color is a theme role token; vendored ui files are exempt.
