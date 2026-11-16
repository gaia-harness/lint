/**
 * Config-level proof of the comment bans through the real composed bundle:
 * commented-out code (`sonarjs/no-commented-code`, from guardrails) and a
 * comment that opens with TODO or FIXME (`no-warning-comments`, from
 * style-hygiene). Prose that mentions the words mid-sentence passes, and
 * `unicorn/expiring-todo-comments` stays off so it never contradicts the ban.
 *
 * Composed the way style-hygiene.test.ts composes it, with type-aware parsing
 * off because the probe path does not exist on disk. Every case asserts one
 * result with no fatal message before any rule id is read.
 */
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {describe, expect, it} from 'vitest';
import gaiaLint from '../index.js';

const COMMENTED_CODE = 'sonarjs/no-commented-code';
const WARNING_COMMENT = 'no-warning-comments';
const EXPIRING_TODO = 'unicorn/expiring-todo-comments';
const COMMENT_RULES = new Set([COMMENTED_CODE, EXPIRING_TODO, WARNING_COMMENT]);

const lint = gaiaLint();

const eslint = new ESLint({
  overrideConfig: [
    ...lint.base,
    ...lint.react,
    ...lint.testing,
    ...lint.styleHygiene,
    ...lint.guardrails,
    ...lint.prettier,
    tseslint.configs.disableTypeChecked as Linter.Config,
    {languageOptions: {parserOptions: {project: null, projectService: false}}},
  ],
  overrideConfigFile: true,
});

const commentRuleIds = async (comment: string): Promise<string[]> => {
  const code = `${comment}\nexport const probe = (): number => 1;\n`;
  const results = await eslint.lintText(code, {filePath: 'app/utils/probe.ts'});
  expect(results).toHaveLength(1);
  const [result] = results;
  const fatal = result.messages.filter((message) => message.fatal === true);
  expect(fatal).toEqual([]);
  return result.messages
    .map((message) => message.ruleId ?? '')
    .filter((ruleId) => COMMENT_RULES.has(ruleId));
};

describe('comment hygiene', () => {
  it.each([
    ['// const unused = probe();'],
    ['// if (ready) {\n//   start();\n// }'],
  ])('reports commented-out code: %s', async (comment) => {
    expect(await commentRuleIds(comment)).toEqual([COMMENTED_CODE]);
  });

  it.each([
    ['// TODO: wire this up'],
    ['// FIXME breaks on empty input'],
    ['// todo lower case'],
    ['/* TODO in a block comment */'],
    ['// TODO [2030-01-01]: carries an expiry condition'],
  ])('reports a comment that opens with TODO or FIXME: %s', async (comment) => {
    expect(await commentRuleIds(comment)).toEqual([WARNING_COMMENT]);
  });

  it.each([
    ['// Explains why the probe returns one.'],
    ['// The scaffold no longer writes a todo marker here.'],
  ])('passes prose: %s', async (comment) => {
    expect(await commentRuleIds(comment)).toEqual([]);
  });
});
