/**
 * Resolution suite for `import-x/no-unresolved` in `base`.
 *
 * Under the source dir the rule covers every TypeScript file, tests and
 * stories included, and ignores `^virtual:` so Vite plugin virtual modules
 * (`virtual:msw`) pass. `calculateConfigForFile` computes config only; it
 * never parses the file, so the paths below do not need to exist.
 */
import {ESLint} from 'eslint';
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
