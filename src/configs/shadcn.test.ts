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
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import gaiaLint from '../index.js';

const PAGE_FILE = 'app/pages/index/page.tsx';
const COMPONENT_FILE = 'app/components/x/index.tsx';
const UI_FILE = 'app/components/ui/button.tsx';
const UI_TEST_FILE = 'app/components/ui/tests/button.stories.tsx';

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

  it('no-arbitrary-values errors outside ui and is off in vendored ui', async () => {
    const eslint = defaultLinter();
    const outside = await lintFile(eslint, component('pl-[2.3rem]'), COMPONENT_FILE);
    const inside = await lintFile(eslint, component('pl-[2.3rem]'), UI_FILE);
    expect(outside).toContain('shadcn/no-arbitrary-values');
    expect(inside).not.toContain('shadcn/no-arbitrary-values');
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

  it('no-arbitrary-values and no-inline-styles stay on in ui/tests', async () => {
    const eslint = defaultLinter();
    const arbitrary = await lintFile(
      eslint,
      component('pl-[2.3rem]'),
      UI_TEST_FILE,
    );
    expect(arbitrary).toContain('shadcn/no-arbitrary-values');
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

  it('no-unknown-classes is off for shadcn and an error for better-tailwindcss', async () => {
    const eslint = defaultLinter();

    for (const filePath of [COMPONENT_FILE, UI_FILE, UI_TEST_FILE]) {
      expect(
        await severityOf(eslint, filePath, 'shadcn/no-unknown-classes'),
        filePath,
      ).toBe(0);
      expect(
        await severityOf(eslint, filePath, 'better-tailwindcss/no-unknown-classes'),
        filePath,
      ).toBe(2);
    }
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
