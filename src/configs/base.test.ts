/**
 * Resolution suite for `import-x/no-unresolved` in `base`.
 *
 * Under the source dir the rule covers every TypeScript file, tests and
 * stories included, and ignores `^virtual:` so Vite plugin virtual modules
 * (`virtual:msw`) pass. `calculateConfigForFile` computes config only; it
 * never parses the file, so the paths below do not need to exist.
 */
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {describe, expect, test} from 'vitest';
import {buildBase} from './base.js';
import {react} from './react.js';

const EXPECTED_ENTRY = [
  2,
  {caseSensitive: true, commonjs: true, ignore: ['^virtual:']},
];

const noUnresolvedFor = async (file: string): Promise<unknown> => {
  const eslint = new ESLint({
    overrideConfig: [...buildBase('app'), ...react],
    overrideConfigFile: true,
  });
  const resolved = await eslint.calculateConfigForFile(file);
  return resolved.rules['import-x/no-unresolved'];
};

describe('import-x/no-unresolved', () => {
  test.each([
    'app/entry.client.tsx',
    'app/components/Button/index.tsx',
    'app/components/Button/tests/index.stories.tsx',
    'app/utils/tests/format.test.ts',
    'vite.config.ts',
  ])('is on with the virtual-module ignore for %s', async (file) => {
    expect(await noUnresolvedFor(file)).toEqual(EXPECTED_ENTRY);
  });

  test('stays off for .storybook files', async () => {
    const [severity] = (await noUnresolvedFor('.storybook/preview.ts')) as [
      number,
    ];
    expect(severity).toBe(0);
  });
});

const severityFor = async (file: string, rule: string): Promise<number> => {
  const eslint = new ESLint({
    overrideConfig: [...buildBase('app'), ...react],
    overrideConfigFile: true,
  });
  const resolved = await eslint.calculateConfigForFile(file);
  const entry = resolved.rules[rule] as [number, ...unknown[]] | undefined;
  return entry ? entry[0] : 0;
};

describe('type-aware safety rules', () => {
  test.each([
    '@typescript-eslint/no-deprecated',
    '@typescript-eslint/no-unnecessary-type-conversion',
    '@typescript-eslint/no-unsafe-argument',
    '@typescript-eslint/no-unsafe-call',
    '@typescript-eslint/no-unsafe-member-access',
  ])('%s is on for source files', async (rule) => {
    expect(await severityFor('app/utils/format.ts', rule)).toBe(2);
  });

  test.each([
    '@typescript-eslint/no-unsafe-argument',
    '@typescript-eslint/no-unsafe-call',
    '@typescript-eslint/no-unsafe-member-access',
  ])('%s is off for tests and stories, like no-unsafe-assignment', async (rule) => {
    expect(await severityFor('app/utils/tests/format.test.ts', rule)).toBe(0);
    expect(
      await severityFor('app/components/Button/tests/index.stories.tsx', rule),
    ).toBe(0);
  });
});

describe('disable-directive hygiene', () => {
  const eslint = new ESLint({
    overrideConfig: [
      ...buildBase('app'),
      ...react,
      tseslint.configs.disableTypeChecked as Linter.Config,
      {
        languageOptions: {
          parserOptions: {project: null, projectService: false},
        },
      },
    ],
    overrideConfigFile: true,
  });

  const ruleIdsFor = async (code: string): Promise<(string | null)[]> => {
    const [result] = await eslint.lintText(code, {
      filePath: 'app/utils/probe.ts',
    });
    return result.messages.map((message) => message.ruleId);
  };

  test('a directive without a reason is reported', async () => {
    expect(
      await ruleIdsFor(
        '// eslint-disable-next-line no-console\nconsole.log(1);\n\nexport const value = 1;\n',
      ),
    ).toEqual(['@eslint-community/eslint-comments/require-description']);
  });

  test('a directive with a reason after -- passes', async () => {
    expect(
      await ruleIdsFor(
        '// eslint-disable-next-line no-console -- startup banner\nconsole.log(1);\n\nexport const value = 1;\n',
      ),
    ).toEqual([]);
  });

  test('a blanket disable is reported', async () => {
    expect(
      await ruleIdsFor(
        '/* eslint-disable -- legacy file */\nexport const value = 1;\n',
      ),
    ).toContain('@eslint-community/eslint-comments/no-unlimited-disable');
  });

  test('a whole-file disable at the top needs no matching enable', async () => {
    expect(
      await ruleIdsFor(
        '/* eslint-disable no-console -- server log output */\nconsole.log(1);\n\nexport const value = 1;\n',
      ),
    ).toEqual([]);
  });
});
