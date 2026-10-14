/**
 * The opt-in `zod` block reports eslint-plugin-zod's recommended findings and
 * accepts GAIA's named `import {z} from 'zod'` style.
 */
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {describe, expect, test} from 'vitest';
import gaiaLint from '../index.js';

const lint = gaiaLint();

const eslint = new ESLint({
  overrideConfig: [
    ...lint.base,
    ...lint.react,
    ...lint.zod,
    tseslint.configs.disableTypeChecked as Linter.Config,
    {languageOptions: {parserOptions: {project: null, projectService: false}}},
  ],
  overrideConfigFile: true,
});

const zodIdsFor = async (code: string): Promise<string[]> => {
  const [result] = await eslint.lintText(code, {filePath: 'app/services/probe.ts'});
  return result.messages
    .map((message) => message.ruleId ?? '')
    .filter((ruleId) => ruleId.startsWith('zod/'));
};

describe('zod', () => {
  test('a refine without an error message is reported', async () => {
    expect(
      await zodIdsFor(
        "import {z} from 'zod';\n\nexport const NameSchema = z.string().refine((value) => value.length > 1);\n",
      ),
    ).toContain('zod/require-error-message');
  });

  test('optional with default is reported', async () => {
    expect(
      await zodIdsFor(
        "import {z} from 'zod';\n\nexport const NameSchema = z.string().optional().default('x');\n",
      ),
    ).toContain('zod/no-optional-and-default-together');
  });

  test('the named import style and ZodError pass', async () => {
    expect(
      await zodIdsFor(
        "import {z, ZodError} from 'zod';\n\nexport const NameSchema = z.string().min(1, 'Required');\n\nexport const isZodError = (error: unknown) => error instanceof ZodError;\n",
      ),
    ).toEqual([]);
  });
});
