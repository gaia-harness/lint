/**
 * Config-level proof of the `shadcn()` bundle through the real composed GAIA
 * configuration: the token rules fire inside and outside the vendored ui
 * folder as intended, the vendored-ui exemption turns house style off for
 * `ui/*.tsx` only (not for `ui/tests/**` and not for any other folder), and
 * correctness rules stay on inside vendored ui.
 *
 * The theme comes from a `components.json` fixture written to a temp directory:
 * `tailwind.css` imports Tailwind and `theme.css` and carries the `@theme
 * inline` token map, and `components.json` names `tailwind.css` (never
 * `theme.css`, which @shadcn/lint cannot read tokens from).
 */
import {mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import gaiaLint from '../index.js';
import {REACT_DOCTOR_CAPABILITIES} from './react-doctor.js';

const PAGE_FILE = 'app/pages/index/page.tsx';
const COMPONENT_FILE = 'app/components/x/index.tsx';
const UI_FILE = 'app/components/ui/button.tsx';
const UI_TEST_FILE = 'app/components/ui/tests/button.stories.tsx';
const PAGINATION_FILE = 'app/components/ui/pagination.tsx';
const VENDORED_HELPER_FILES = [
  'app/hooks/use-highlighted-code.ts',
  'app/hooks/use-mobile.ts',
  'app/utils/highlighter.tsx',
];

// PaginationLink as `shadcn add pagination` writes it: the anchor's content
// arrives through the spread props (`children`).
const PAGINATION_LINK = `import * as React from "react"

function PaginationLink({ isActive, ...props }: React.ComponentProps<"a"> & { isActive?: boolean }) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      {...props}
    />
  )
}

export { PaginationLink }
`;

const THEME_CSS = `:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}
`;

const TAILWIND_CSS = `@import 'tailwindcss';
@import './theme.css';

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
`;

const COMPONENTS_JSON = JSON.stringify({
  $schema: 'https://ui.shadcn.com/schema.json',
  aliases: {ui: '~/components/ui', utils: '~/utils/cn'},
  style: 'base-nova',
  tailwind: {baseColor: 'neutral', css: 'app/styles/tailwind.css'},
});

let fixtureRoot = '';

type ShadcnOptions = Parameters<ReturnType<typeof gaiaLint>['shadcn']>[0];

const buildComposition = (
  shadcnOptions?: ShadcnOptions,
  typeAware = false,
): Linter.Config[] => {
  const lint = gaiaLint();

  return [
    ...lint.base,
    ...lint.react,
    ...lint.reactRouter,
    ...lint.testing,
    ...lint.storybook,
    ...lint.playwright,
    ...lint.styleHygiene,
    ...lint.guardrails,
    ...lint.betterTailwind({
      entryPoint: path.join(fixtureRoot, 'app/styles/tailwind.css'),
    }),
    ...lint.prettier,
    ...lint.shadcn(shadcnOptions),
    // The probe paths do not exist on disk, so linting a string needs
    // type-aware parsing off. Severity checks read the config only and keep
    // the type-aware rules as the consumer sees them.
    ...(typeAware
      ? []
      : [
          tseslint.configs.disableTypeChecked as Linter.Config,
          {
            languageOptions: {
              parserOptions: {project: null, projectService: false},
            },
          },
        ]),
  ];
};

const createLinter = (shadcnOptions?: ShadcnOptions, typeAware = false): ESLint =>
  new ESLint({
    cwd: fixtureRoot,
    overrideConfig: buildComposition(shadcnOptions, typeAware),
    overrideConfigFile: true,
  });

const lintFile = async (
  eslint: ESLint,
  code: string,
  filePath: string,
): Promise<string[]> => {
  const results = await eslint.lintText(code, {filePath});
  expect(results, `one result for ${filePath}`).toHaveLength(1);
  const [result] = results;
  const fatal = result.messages.filter((message) => message.fatal === true);
  expect(fatal, `fatal messages at ${filePath}`).toEqual([]);
  const ignored = result.messages.filter((message) =>
    message.message.startsWith('File ignored'),
  );
  expect(ignored, `ignore warnings at ${filePath}`).toEqual([]);

  return result.messages.map((message) => message.ruleId ?? '');
};

const entryOf = async (
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown[]> => {
  const config = (await eslint.calculateConfigForFile(filePath)) as Linter.Config;
  const entry = config.rules?.[ruleId];

  return Array.isArray(entry) ? entry : [entry];
};

const severityOf = async (
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> => (await entryOf(eslint, filePath, ruleId))[0];

const defaultLinter = (): ESLint => createLinter();

beforeAll(() => {
  fixtureRoot = mkdtempSync(path.join(tmpdir(), 'gaia-lint-shadcn-'));
  mkdirSync(path.join(fixtureRoot, 'app/styles'), {recursive: true});
  writeFileSync(path.join(fixtureRoot, 'components.json'), COMPONENTS_JSON);
  writeFileSync(path.join(fixtureRoot, 'app/styles/tailwind.css'), TAILWIND_CSS);
  writeFileSync(path.join(fixtureRoot, 'app/styles/theme.css'), THEME_CSS);

  // @shadcn/lint resolves `tailwindcss` from the project root; link the copy
  // better-tailwindcss resolved so the fixture reads the real theme.
  const tailwindEntry = createRequire(
    createRequire(import.meta.url).resolve('eslint-plugin-better-tailwindcss'),
  ).resolve('tailwindcss/package.json');
  mkdirSync(path.join(fixtureRoot, 'node_modules'));
  symlinkSync(
    path.dirname(tailwindEntry),
    path.join(fixtureRoot, 'node_modules/tailwindcss'),
  );
});

afterAll(() => {
  rmSync(fixtureRoot, {force: true, recursive: true});
});

const component = (className: string): string =>
  `export const X = () => <div className="${className}" />;\n`;

describe('shadcn token rules', () => {
  it('no-raw-colors is an error in a component and in vendored ui', async () => {
    const eslint = defaultLinter();

    for (const filePath of [COMPONENT_FILE, UI_FILE]) {
      const ids = await lintFile(eslint, component('bg-blue-500'), filePath);
      expect(ids, filePath).toContain('shadcn/no-raw-colors');
    }
  });

  it('no-raw-colors accepts a declared token (the fixture theme is read)', async () => {
    const ids = await lintFile(
      defaultLinter(),
      component('bg-background text-foreground'),
      COMPONENT_FILE,
    );
    expect(ids).not.toContain('shadcn/no-raw-colors');
  });

  it('no-raw-colors rejects an undeclared token (discovery is not degraded)', async () => {
    const ids = await lintFile(
      defaultLinter(),
      component('bg-not-a-token'),
      COMPONENT_FILE,
    );
    expect(ids).toContain('shadcn/no-raw-colors');
  });

  it.each([
    'bg-size-[200%_100%]',
    'grid-cols-[auto_1fr]',
    'pl-[2.3rem]',
  ])('an arbitrary value with no scale step lints clean: %s', async (className) => {
    const ids = await lintFile(
      defaultLinter(),
      component(className),
      COMPONENT_FILE,
    );
    expect(ids).toEqual([]);
  });

  it('an arbitrary value with a scale step is rewritten to it', async () => {
    const eslint = defaultLinter();

    for (const className of ['w-[16px]', 'mt-[1rem]']) {
      const ids = await lintFile(eslint, component(className), COMPONENT_FILE);
      expect(ids, className).toContain(
        'better-tailwindcss/enforce-canonical-classes',
      );
    }
  });

  it.each([
    'bg-[#ff0000]',
    'text-[rgb(0_0_0)]',
    'border-[hsl(0_0%_0%)]',
    'text-[oklch(0.5_0.1_200)]',
    'bg-[color:var(--brand)]',
  ])('an arbitrary color errors outside ui and in ui/tests, never in vendored ui: %s', async (className) => {
    const eslint = defaultLinter();
    const rule = 'better-tailwindcss/no-restricted-classes';
    expect(await lintFile(eslint, component(className), COMPONENT_FILE)).toContain(rule);
    expect(await lintFile(eslint, component(className), UI_TEST_FILE)).toContain(rule);
    expect(await lintFile(eslint, component(className), UI_FILE)).not.toContain(rule);
  });

  it('require-static-classes errors outside ui and is off in vendored ui', async () => {
    const eslint = defaultLinter();
    const code =
      "import {Button} from '~/components/ui/button';\n\nexport const X = ({color}: {color: string}) => <Button className={`bg-${color}`} />;\n";
    const outside = await lintFile(eslint, code, COMPONENT_FILE);
    const inside = await lintFile(eslint, code, UI_FILE);
    expect(outside).toContain('shadcn/require-static-classes');
    expect(inside).not.toContain('shadcn/require-static-classes');
  });

  it('no-inline-styles errors outside ui and is off in vendored ui', async () => {
    const eslint = defaultLinter();
    const code = 'export const X = () => <div style={{minWidth: 4}} />;\n';
    const outside = await lintFile(eslint, code, COMPONENT_FILE);
    const inside = await lintFile(eslint, code, UI_FILE);
    expect(outside).toContain('shadcn/no-inline-styles');
    expect(inside).not.toContain('shadcn/no-inline-styles');
  });

  it('no-inline-styles stays on in ui/tests', async () => {
    const ids = await lintFile(
      defaultLinter(),
      'export const X = () => <div style={{minWidth: 4}} />;\n',
      UI_TEST_FILE,
    );
    expect(ids).toContain('shadcn/no-inline-styles');
  });
});

describe('shadcn settings and rule severities', () => {
  it('shadcn/settings has no files key and carries settings.shadcn.ui', () => {
    const block = buildComposition().find(
      (config) => config.name === 'shadcn/settings',
    );
    expect(block).toBeDefined();
    expect(block).not.toHaveProperty('files');
    expect(block?.settings).toEqual({shadcn: {ui: '~/components/ui'}});
  });

  it('settings.shadcn.ui follows the ui option and is never a rule option', () => {
    const configs = buildComposition({ui: '@/ds'});
    const block = configs.find((config) => config.name === 'shadcn/settings');
    expect(block?.settings).toEqual({shadcn: {ui: '@/ds'}});
    const shadcnBlocks = configs.filter((config) =>
      config.name?.startsWith('shadcn/'),
    );
    for (const shadcnBlock of shadcnBlocks) {
      expect(JSON.stringify(shadcnBlock.rules ?? {})).not.toContain('"ui"');
    }
  });

  it('no-unknown-classes is off for shadcn and an error for better-tailwindcss outside vendored ui', async () => {
    const eslint = defaultLinter();

    for (const filePath of [COMPONENT_FILE, UI_FILE, UI_TEST_FILE]) {
      expect(
        await severityOf(eslint, filePath, 'shadcn/no-unknown-classes'),
        filePath,
      ).toBe(0);
    }

    for (const filePath of [COMPONENT_FILE, UI_TEST_FILE]) {
      expect(
        await severityOf(eslint, filePath, 'better-tailwindcss/no-unknown-classes'),
        filePath,
      ).toBe(2);
    }

    expect(
      await severityOf(eslint, UI_FILE, 'better-tailwindcss/no-unknown-classes'),
    ).toBe(0);
  });

  it('no-restyle is an error with allow layout outside ui and off in vendored ui', async () => {
    const eslint = defaultLinter();
    expect(await entryOf(eslint, PAGE_FILE, 'shadcn/no-restyle')).toEqual([
      2,
      {allow: ['layout']},
    ]);
    expect(await severityOf(eslint, UI_FILE, 'shadcn/no-restyle')).toBe(0);
  });

  it('restyleOffFiles turns no-restyle off there, never in pages or ui/tests', async () => {
    const eslint = createLinter({restyleOffFiles: ['app/components/**/*.tsx']});
    expect(
      await severityOf(eslint, COMPONENT_FILE, 'shadcn/no-restyle'),
    ).toBe(0);
    expect(await entryOf(eslint, PAGE_FILE, 'shadcn/no-restyle')).toEqual([
      2,
      {allow: ['layout']},
    ]);
    expect(
      await entryOf(eslint, UI_TEST_FILE, 'shadcn/no-restyle'),
    ).toEqual([2, {allow: ['layout']}]);
  });

  it('shadcn/restyle-fallback exists only when restyleOffFiles is set', () => {
    const names = (configs: Linter.Config[]): (string | undefined)[] =>
      configs.map((config) => config.name);
    expect(names(buildComposition())).not.toContain('shadcn/restyle-fallback');
    expect(names(buildComposition({restyleOffFiles: ['a/**']}))).toContain(
      'shadcn/restyle-fallback',
    );
  });
});

describe('vendored-ui exemption', () => {
  const NOT_ARROW = 'function Foo() {\n  return 1;\n}\n\nexport default Foo;\n';
  const MISFORMATTED = "export const a = {b:   1,\n c:2}\n";
  const ARRAY_TYPE = 'export const list: Array<string> = [];\n';

  const EXEMPTED: [rule: string, code: string][] = [
    ['prefer-arrow-functions/prefer-arrow-functions', NOT_ARROW],
    ['prettier/prettier', MISFORMATTED],
    ['@typescript-eslint/array-type', ARRAY_TYPE],
  ];

  it.each(EXEMPTED)(
    '%s reports outside vendored ui, in ui/tests and nowhere in vendored ui',
    async (rule, code) => {
      const eslint = defaultLinter();
      expect(await lintFile(eslint, code, COMPONENT_FILE), COMPONENT_FILE).toContain(rule);
      expect(await lintFile(eslint, code, UI_TEST_FILE), UI_TEST_FILE).toContain(rule);
      expect(await lintFile(eslint, code, UI_FILE), UI_FILE).not.toContain(rule);
    },
  );

  it('a rules-of-hooks violation still reports inside vendored ui', async () => {
    const code =
      'export const Button = ({on}: {on: boolean}) => {\n  if (on) {\n    useFoo();\n  }\n\n  return <div />;\n};\n';
    const ids = await lintFile(defaultLinter(), code, UI_FILE);
    expect(ids).toContain('react-hooks/rules-of-hooks');
  });

  it.each([
    '@typescript-eslint/no-unnecessary-condition',
    'eqeqeq',
    'react/no-array-index-key',
    'jsx-a11y/label-has-associated-control',
    'jsx-a11y/click-events-have-key-events',
    'jsx-a11y/no-noninteractive-element-interactions',
    'shadcn/require-static-classes',
    '@typescript-eslint/prefer-destructuring',
  ])('%s is off in vendored ui and stays on in ui/tests', async (rule) => {
    const eslint = createLinter(undefined, true);
    expect(await severityOf(eslint, UI_FILE, rule)).toBe(0);
    expect(await severityOf(eslint, UI_TEST_FILE, rule)).toBe(2);
  });

  it.each([
    '@eslint-react/no-context-provider',
    '@eslint-react/no-use-context',
    '@stylistic/padding-line-between-statements',
    '@typescript-eslint/no-confusing-void-expression',
    '@typescript-eslint/no-import-type-side-effects',
    '@typescript-eslint/no-shadow',
    '@typescript-eslint/no-unnecessary-type-assertion',
    '@typescript-eslint/prefer-nullish-coalescing',
    '@typescript-eslint/restrict-template-expressions',
    'arrow-body-style',
    'better-tailwindcss/no-deprecated-classes',
    'better-tailwindcss/no-unknown-classes',
    'cn-conditional/cn-conditional',
    'jsx-a11y/anchor-has-content',
    'jsx-a11y/no-noninteractive-tabindex',
    'object-shorthand',
    'react-hooks/set-state-in-effect',
    'react-you-might-not-need-an-effect/no-event-handler',
    'react-you-might-not-need-an-effect/no-external-store-subscription',
    'react-you-might-not-need-an-effect/no-initialize-state',
    'react-you-might-not-need-an-effect/no-pass-data-to-parent',
    'react/button-has-type',
    'react/jsx-boolean-value',
    'react/jsx-no-constructed-context-values',
    'react/no-unstable-nested-components',
    'sonarjs/no-redundant-optional',
    'sonarjs/pseudo-random',
    'unicorn/explicit-length-check',
    'unicorn/no-document-cookie',
    'unicorn/no-negated-condition',
    'unicorn/prefer-string-replace-all',
  ])('%s (full-registry sweep) is off in vendored ui and on in ui/tests', async (rule) => {
    const eslint = createLinter(undefined, true);
    expect(await severityOf(eslint, UI_FILE, rule)).toBe(0);
    expect(await severityOf(eslint, UI_TEST_FILE, rule)).not.toBe(0);
  });

  // Off for stories and tsx by the base config, so each probe names a file
  // where the rule is on outside vendored output.
  it.each([
    ['@typescript-eslint/explicit-module-boundary-types', 'app/hooks/use-mobile.ts', 'app/hooks/use-thing.ts'],
    ['@typescript-eslint/no-unsafe-argument', UI_FILE, COMPONENT_FILE],
    ['@typescript-eslint/no-unsafe-assignment', UI_FILE, COMPONENT_FILE],
    ['@typescript-eslint/no-unsafe-member-access', UI_FILE, COMPONENT_FILE],
  ])('%s (full-registry sweep) is off in %s and on in %s', async (rule, vendoredFile, ownFile) => {
    const eslint = createLinter(undefined, true);
    expect(await severityOf(eslint, vendoredFile, rule)).toBe(0);
    expect(await severityOf(eslint, ownFile, rule)).toBe(2);
  });

  it('a stock pagination link lints clean in vendored ui; the same anchor fails elsewhere and in ui/tests', async () => {
    const eslint = defaultLinter();
    const rule = 'jsx-a11y/anchor-has-content';
    expect(await lintFile(eslint, PAGINATION_LINK, PAGINATION_FILE)).not.toContain(rule);
    expect(await lintFile(eslint, PAGINATION_LINK, COMPONENT_FILE)).toContain(rule);
    expect(await lintFile(eslint, PAGINATION_LINK, UI_TEST_FILE)).toContain(rule);
  });

  it.each(VENDORED_HELPER_FILES)(
    'the registry helper %s is vendored by default',
    async (filePath) => {
      const eslint = defaultLinter();
      expect(await lintFile(eslint, NOT_ARROW, filePath)).not.toContain(
        'prefer-arrow-functions/prefer-arrow-functions',
      );
      expect(
        await severityOf(eslint, filePath, 'react-hooks/rules-of-hooks'),
      ).toBe(2);
    },
  );

  it('a GAIA-authored hook beside the registry helpers stays fully linted', async () => {
    const ids = await lintFile(defaultLinter(), NOT_ARROW, 'app/hooks/use-thing.ts');
    expect(ids).toContain('prefer-arrow-functions/prefer-arrow-functions');
  });

  it('react-refresh/only-export-components is off in vendored ui and on in components', async () => {
    const eslint = createLinter(undefined, true);
    const rule = 'react-refresh/only-export-components';
    expect(await severityOf(eslint, UI_FILE, rule)).toBe(0);
    expect(await severityOf(eslint, COMPONENT_FILE, rule)).toBe(2);
  });

  it('shadcn/no-raw-colors and react-hooks rules stay on in vendored ui', async () => {
    const eslint = defaultLinter();

    for (const rule of [
      'shadcn/no-raw-colors',
      'react-hooks/rules-of-hooks',
      'react-hooks/exhaustive-deps',
    ]) {
      expect(await severityOf(eslint, UI_FILE, rule), rule).toBe(2);
    }
  });

  it('a namespace react import is allowed in vendored ui and still bans FC elsewhere', async () => {
    const eslint = defaultLinter();
    const namespaceImport = "import * as React from 'react';\n\nexport const x = React.version;\n";
    expect(await lintFile(eslint, namespaceImport, UI_FILE)).not.toContain('no-restricted-imports');
    expect(await lintFile(eslint, namespaceImport, COMPONENT_FILE)).toContain('no-restricted-imports');
    const conformImport = "import {parseWithZod} from '@conform-to/zod';\n\nexport const x = parseWithZod;\n";
    expect(await lintFile(eslint, conformImport, UI_FILE)).toContain('no-restricted-imports');
  });

  it('uiFiles overrides the vendored glob', async () => {
    const eslint = createLinter({uiFiles: ['app/vendor/*.tsx']});
    const ids = await lintFile(eslint, NOT_ARROW, UI_FILE);
    expect(ids).toContain('prefer-arrow-functions/prefer-arrow-functions');
  });
});

describe('react-doctor shadcn rules', () => {
  const SHADCN_RD_RULES = [
    'react-doctor/shadcn-dialog-content-requires-title',
    'react-doctor/shadcn-icon-button-requires-label',
    'react-doctor/shadcn-input-group-no-raw-controls',
    'react-doctor/shadcn-tabs-trigger-requires-list',
  ];
  const MOTION_FONT_RD_RULES = [
    'react-doctor/no-arbitrary-px-font-size',
    'react-doctor/no-smooth-scroll-without-reduced-motion',
    'react-doctor/no-ungated-tailwind-animation',
  ];

  it('are warn on GAIA source files', async () => {
    const eslint = defaultLinter();

    for (const rule of SHADCN_RD_RULES) {
      for (const file of [COMPONENT_FILE, PAGE_FILE]) {
        expect(await severityOf(eslint, file, rule), `${rule} at ${file}`).toBe(1);
      }
    }
  });

  it('are off in vendored ui, which defines the primitives they check', async () => {
    const eslint = defaultLinter();

    for (const rule of SHADCN_RD_RULES) {
      expect(await severityOf(eslint, UI_FILE, rule), rule).toBe(0);
    }
  });

  it('motion and font rules are warn on GAIA source and off in vendored ui', async () => {
    const eslint = defaultLinter();

    for (const rule of MOTION_FONT_RD_RULES) {
      expect(await severityOf(eslint, COMPONENT_FILE, rule), rule).toBe(1);
      expect(await severityOf(eslint, UI_FILE, rule), rule).toBe(0);
    }
  });

  it('the full composition enables exactly the 125 curated react-doctor rules', async () => {
    const eslint = defaultLinter();
    const config = (await eslint.calculateConfigForFile(COMPONENT_FILE)) as Linter.Config;
    const enabled = Object.entries(config.rules ?? {}).filter(([rule, entry]) => {
      const severity = Array.isArray(entry) ? entry[0] : entry;
      return rule.startsWith('react-doctor/') && severity !== 0 && severity !== 'off';
    });
    expect(enabled).toHaveLength(125);
  });

  // The full curated list with severities, so a swapped, dropped or
  // re-severitied rule fails even when the count holds. Update the snapshot
  // only for a deliberate change to the curated set.
  it('the curated react-doctor rule set and severities match the snapshot', async () => {
    const eslint = defaultLinter();
    const config = (await eslint.calculateConfigForFile(COMPONENT_FILE)) as Linter.Config;
    const curated = Object.entries(config.rules ?? {})
      .filter(([rule]) => rule.startsWith('react-doctor/'))
      .map(([rule, entry]) => `${rule} ${String(Array.isArray(entry) ? entry[0] : entry)}`)
      .sort();
    expect(curated).toMatchSnapshot();
  });

  // The plugin gates each rule on `settings['react-doctor'].capabilities`
  // once that list is set: every entry in the rule's own `requires` must
  // appear verbatim, or the rule silently reports nothing. So every rule the
  // composition enables, in any block or file class, must find each of its
  // `requires` in REACT_DOCTOR_CAPABILITIES. `requires` is read from the
  // plugin's own rule metadata (the ESLint wrapper drops it, so it comes from
  // the oxlint plugin the wrapper re-exports), never from a hand-copied list.
  it('every enabled react-doctor rule has each capability it requires', async () => {
    const eslint = defaultLinter();
    const files = [
      COMPONENT_FILE,
      PAGE_FILE,
      UI_FILE,
      UI_TEST_FILE,
      'app/root.tsx',
      'app/routes/_public._index.tsx',
      'app/hooks/use-probe.ts',
      'app/services/items/queries.ts',
      'app/components/x/tests/index.test.tsx',
      'app/components/x/tests/index.stories.tsx',
      '.playwright/e2e/probe.spec.ts',
    ];
    const enabled = new Set<string>();
    for (const file of files) {
      const config = (await eslint.calculateConfigForFile(file)) as Linter.Config;
      for (const [rule, entry] of Object.entries(config.rules ?? {})) {
        const severity = Array.isArray(entry) ? entry[0] : entry;
        if (rule.startsWith('react-doctor/') && severity !== 0 && severity !== 'off') {
          enabled.add(rule.slice('react-doctor/'.length));
        }
      }
    }
    expect(enabled.size).toBe(125);

    const requireFromWrapper = createRequire(
      createRequire(import.meta.url).resolve('eslint-plugin-react-doctor'),
    );
    const oxlintPlugin = (await import(
      pathToFileURL(requireFromWrapper.resolve('oxlint-plugin-react-doctor')).href
    )) as {default: {rules: Record<string, {requires?: string[]}>}};

    const missing = [...enabled].flatMap((rule) =>
      (oxlintPlugin.default.rules[rule]?.requires ?? [])
        .filter((capability) => !REACT_DOCTOR_CAPABILITIES.includes(capability))
        .map((capability) => `${rule} requires ${capability}`),
    );
    expect(missing).toEqual([]);
    expect(
      [...enabled].filter((rule) => oxlintPlugin.default.rules[rule] === undefined),
    ).toEqual([]);
  });

  it('an icon-only Button without a label is reported', async () => {
    const eslint = defaultLinter();
    const code = [
      "import {XIcon} from 'lucide-react';",
      "import {Button} from '~/components/ui/button';",
      '',
      'export const Probe = () => (',
      '  <Button size="icon">',
      '    <XIcon />',
      '  </Button>',
      ');',
      '',
    ].join('\n');
    expect(await lintFile(eslint, code, COMPONENT_FILE)).toContain(
      'react-doctor/shadcn-icon-button-requires-label',
    );
  });
});
