/**
 * Config-level proof of GAIA's file and folder naming conventions through the
 * real composed bundle: kebab-case component and page folders, flat kebab
 * files in `components/ui/`, `page.tsx` route pages, `use-*.ts` hooks, and the
 * kebab transform on `canonical/filename-match-exported` for component and
 * page files only.
 *
 * The bundle is composed from `gaiaLint()` the way
 * `examples/consumer-eslint.config.mjs` does, minus `betterTailwind` (it needs
 * a CSS entry point) and `ignores`. The probe paths do not exist on disk, so
 * the last config blocks switch type-aware parsing off. Every case asserts one
 * result, no fatal message, and no "File ignored" warning before any count is
 * read, so a parse failure or an ignored path fails the test instead of passing
 * a zero-count case.
 */
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {describe, expect, it} from 'vitest';
import gaiaLint from '../index.js';

const FILENAME_RULE = 'check-file/filename-naming-convention';
const FOLDER_RULE = 'check-file/folder-naming-convention';
const MATCH_EXPORTED_RULE = 'canonical/filename-match-exported';

const lint = gaiaLint();

const composed: Linter.Config[] = [
  ...lint.base,
  ...lint.react,
  ...lint.reactRouter,
  ...lint.testing,
  ...lint.storybook,
  ...lint.playwright,
  ...lint.styleHygiene,
  ...lint.guardrails,
  ...lint.prettier,
  // An unused disable directive is a warning, so the `state/index.tsx` case
  // fails if the scoped kebab transform ever stops the directive being used.
  {linterOptions: {reportUnusedDisableDirectives: 'warn'}},
  tseslint.configs.disableTypeChecked as Linter.Config,
  {languageOptions: {parserOptions: {project: null, projectService: false}}},
];

const eslint = new ESLint({overrideConfig: composed, overrideConfigFile: true});

const lintFile = async (
  code: string,
  filePath: string,
): Promise<ESLint.LintResult> => {
  const results = await eslint.lintText(code, {filePath});
  expect(results, `one result for ${filePath}`).toHaveLength(1);
  const [result] = results;
  const fatal = result.messages.filter((message) => message.fatal === true);
  expect(fatal, `fatal messages at ${filePath}`).toEqual([]);
  const ignored = result.messages.filter((message) =>
    message.message.startsWith('File ignored'),
  );
  expect(ignored, `ignore warnings at ${filePath}`).toEqual([]);
  return result;
};

const isNamingRule = (ruleId: null | string): boolean =>
  ruleId !== null &&
  (ruleId.startsWith('check-file/') || ruleId === MATCH_EXPORTED_RULE);

const namingMessages = async (code: string, filePath: string) => {
  const result = await lintFile(code, filePath);
  return result.messages.filter((message) => isNamingRule(message.ruleId));
};

const ruleIds = async (code: string, filePath: string): Promise<string[]> => {
  const result = await lintFile(code, filePath);
  return result.messages.map((message) => message.ruleId ?? '');
};

const component = (name: string): string =>
  `const ${name} = () => null;\n\nexport default ${name};\n`;

const hook = (name: string): string =>
  `export const ${name} = (): boolean => true;\n`;

const story = (title: string): string =>
  `const meta = {title: '${title}'};\n\nexport default meta;\n`;

const ACCEPT_CASES: [filePath: string, code: string][] = [
  [
    'app/components/ui/probe-widget.tsx',
    'export const ProbeWidget = () => null;\n',
  ],
  [
    'app/components/ui/tests/probe-widget.stories.tsx',
    story('Components/UI/ProbeWidget'),
  ],
  ['app/components/probe-card/index.tsx', component('ProbeCard')],
  ['app/pages/probe/page.tsx', component('ProbePage')],
  ['app/pages/probe/probe-panel/index.tsx', component('ProbePanel')],
  ['app/hooks/use-probe.ts', hook('useProbe')],
  // Real GAIA tree shapes
  ['app/components/errors/error-stack/index.tsx', component('ErrorStack')],
  [
    'app/components/errors/root-error-boundary/index.tsx',
    component('RootErrorBoundary'),
  ],
  [
    'app/components/document/meta-hydrated/index.tsx',
    component('MetaHydrated'),
  ],
  [
    'app/components/probe-card/utils/x.ts',
    'export const x = (): number => 1;\n',
  ],
  [
    'app/components/probe-card/tests/stack.ts',
    "export const stack = 'Error: probe';\n",
  ],
  ['app/pages/index/page.tsx', component('IndexPage')],
  ['app/pages/index/tests/page.stories.tsx', story('Pages/Index')],
  [
    'app/hooks/tests/use-theme.test.ts',
    "import {expect, test} from 'vitest';\n\ntest('probe', () => {\n  expect(true).toBe(true);\n});\n",
  ],
  [
    'app/components/probe-card/hooks/use-probe-card.ts',
    hook('useProbeCard'),
  ],
  // A folder whose name extends a reserved subfolder name is a component
  ['app/components/ui-kit/index.tsx', component('UiKit')],
];

const REJECT_CASES: [filePath: string, ruleId: string, code: string][] = [
  ['app/components/ProbeWidget/index.tsx', FOLDER_RULE, component('ProbeWidget')],
  ['app/hooks/useProbe.ts', FILENAME_RULE, hook('useProbe')],
  ['app/pages/Probe/page.tsx', FOLDER_RULE, component('ProbePage')],
  [
    'app/components/ui/ProbeWidget.tsx',
    FILENAME_RULE,
    'export const ProbeWidget = () => null;\n',
  ],
  [
    'app/components/ui/probe-folder/index.tsx',
    FOLDER_RULE,
    component('ProbeFolder'),
  ],
  ['app/components/probe-flat.tsx', FILENAME_RULE, component('ProbeFlat')],
  [
    'app/components/probe-mismatch/index.tsx',
    MATCH_EXPORTED_RULE,
    component('Wrong'),
  ],
  // A folder whose name extends a reserved subfolder name still needs index.tsx
  [
    'app/components/statement/statement-row.tsx',
    FILENAME_RULE,
    component('StatementRow'),
  ],
];

describe('style hygiene naming conventions', () => {
  it.each(ACCEPT_CASES)('accepts %s', async (filePath, code) => {
    expect(await namingMessages(code, filePath)).toEqual([]);
  });

  it.each(REJECT_CASES)(
    'rejects %s with %s',
    async (filePath, ruleId, code) => {
      expect(await ruleIds(code, filePath)).toContain(ruleId);
    },
  );

  it('keeps exact matching for app/i18n.ts exporting i18n', async () => {
    const result = await lintFile(
      'const i18n = new Map<string, string>();\n\nexport default i18n;\n',
      'app/i18n.ts',
    );
    expect(result.messages).toEqual([]);
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });

  it('keeps the disable directive in app/state/index.tsx used', async () => {
    const result = await lintFile(
      `/* eslint-disable canonical/filename-match-exported -- state barrel */\n${component('State')}`,
      'app/state/index.tsx',
    );
    expect(result.messages).toEqual([]);
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });
});
