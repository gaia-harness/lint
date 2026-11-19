/**
 * `@typescript-eslint/no-deprecated` (from `base`) is the one deprecation
 * rule: `guardrails` turns `sonarjs/deprecation` off because it reports the
 * same uses a second time. This suite lints real files with type information
 * through the composed bundle and checks that every use of a `@deprecated`
 * function, method, property, class, default export and overload is still
 * reported, once, by `no-deprecated`.
 *
 * Both rules need the type checker, so the fixture is written to disk with a
 * tsconfig the project service picks up, under the symlink-resolved tmpdir
 * (on macOS `os.tmpdir()` is a `/var` symlink to `/private/var`).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ESLint} from 'eslint';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import gaiaLint from '../index.js';

const LIBRARY = [
  '/** @deprecated Use `current`. */',
  'export const legacy = (): number => 1;',
  '',
  'export const current = (): number => 2;',
  '',
  'export class Service {',
  '  /** @deprecated Read `value`. */',
  '  public legacyValue = 1;',
  '',
  '  public value = 2;',
  '',
  '  /** @deprecated Use `run`. */',
  '  public legacyRun(): number {',
  '    return this.value;',
  '  }',
  '}',
  '',
  '/** @deprecated Use `Service`. */',
  'export class OldService {}',
  '',
  'export function format(input: string): string;',
  '/** @deprecated Pass a string. */',
  'export function format(input: number): string;',
  'export function format(input: number | string): string {',
  '  return String(input);',
  '}',
  '',
  '/** @deprecated Use `current`. */',
  'const fallback = (): number => 3;',
  '',
  'export default fallback;',
  '',
].join('\n');

const CONSUMER = [
  "import fallback, {format, legacy, OldService, Service} from './library.js';",
  '',
  'const service = new Service();',
  '',
  'export const results = [',
  '  legacy(),',
  '  service.legacyRun(),',
  '  service.legacyValue,',
  '  new OldService(),',
  '  fallback(),',
  '  format(1),',
  "  format('fine'),",
  '];',
  '',
].join('\n');

// One report per deprecated use, by line: the function, method, property,
// class, default export and the deprecated overload. `format('fine')` passes.
const DEPRECATED_USE_LINES = [6, 7, 8, 9, 10, 11];

let root: string;

beforeAll(() => {
  root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'gaia-deprecation-'));
  fs.mkdirSync(path.join(root, 'app/utils'), {recursive: true});
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({name: 'fixture', private: true, type: 'module'}),
  );
  fs.writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        noEmit: true,
        strict: true,
        target: 'ES2022',
        types: [],
      },
      include: ['app/**/*.ts'],
    }),
  );
  fs.writeFileSync(path.join(root, 'app/utils/library.ts'), LIBRARY);
  fs.writeFileSync(path.join(root, 'app/utils/consumer.ts'), CONSUMER);
});

afterAll(() => {
  fs.rmSync(root, {force: true, recursive: true});
});

describe('deprecation', () => {
  test('no-deprecated reports every deprecated use; sonarjs/deprecation never runs', async () => {
    const lint = gaiaLint();
    const eslint = new ESLint({
      cwd: root,
      overrideConfig: [
        ...lint.base,
        ...lint.react,
        ...lint.guardrails,
        {languageOptions: {parserOptions: {tsconfigRootDir: root}}},
      ],
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintFiles(['app/utils/consumer.ts']);
    expect(result.messages.filter((message) => message.fatal === true)).toEqual([]);

    const lines = (ruleId: string): number[] =>
      result.messages
        .filter((message) => message.ruleId === ruleId)
        .map((message) => message.line);

    expect(lines('@typescript-eslint/no-deprecated')).toEqual(DEPRECATED_USE_LINES);
    expect(lines('sonarjs/deprecation')).toEqual([]);
  });
});
