/**
 * The opt-in `i18n` block reports raw JSX text in source components, and
 * leaves stories, tests, `tests/` helpers and vendored ui alone.
 */
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {describe, expect, test} from 'vitest';
import gaiaLint from '../index.js';

const RULE = 'i18next/no-literal-string';

const lintWith = (configs: Linter.Config[]): ESLint =>
  new ESLint({
    overrideConfig: [
      ...configs,
      tseslint.configs.disableTypeChecked as Linter.Config,
      {languageOptions: {parserOptions: {project: null, projectService: false}}},
    ],
    overrideConfigFile: true,
  });

const lint = gaiaLint();
const withI18n = lintWith([...lint.base, ...lint.react, ...lint.i18n]);

const hits = async (eslint: ESLint, code: string, filePath: string): Promise<number> => {
  const [result] = await eslint.lintText(code, {filePath});
  return result.messages.filter((message) => message.ruleId === RULE).length;
};

const RAW_TEXT = 'export const Greeting = () => <p>Hello there</p>;\n';
const TRANSLATED =
  "import {useTranslation} from 'react-i18next';\n\nexport const Greeting = () => {\n  const {t} = useTranslation();\n\n  return <p data-slot=\"greeting\">{t('greeting')}</p>;\n};\n";

describe('i18n', () => {
  test('raw JSX text in a component is reported', async () => {
    expect(await hits(withI18n, RAW_TEXT, 'app/components/greeting/index.tsx')).toBe(1);
  });

  test('translated text and attribute strings pass', async () => {
    expect(await hits(withI18n, TRANSLATED, 'app/components/greeting/index.tsx')).toBe(0);
  });

  test.each([
    'app/components/greeting/tests/index.stories.tsx',
    'app/components/greeting/tests/index.test.tsx',
    'app/components/form/tests/fixture-form.tsx',
    'app/components/ui/button.tsx',
  ])('%s is exempt', async (file) => {
    expect(await hits(withI18n, RAW_TEXT, file)).toBe(0);
  });

  test('follows sourceDir', async () => {
    const custom = gaiaLint({sourceDir: 'src'});
    const eslint = lintWith([...custom.base, ...custom.react, ...custom.i18n]);
    expect(await hits(eslint, RAW_TEXT, 'src/components/greeting/index.tsx')).toBe(1);
  });

  test('is opt-in: react alone does not report raw text', async () => {
    const eslint = lintWith([...lint.base, ...lint.react]);
    expect(await hits(eslint, RAW_TEXT, 'app/components/greeting/index.tsx')).toBe(0);
  });
});
