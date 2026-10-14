/**
 * Fixture suite for the `import-x/architecture-boundaries` data-endpoint
 * carve-out (`buildNoRestrictedPathsConfig` inside guardrails.ts).
 *
 * `import-x/no-restricted-paths` resolves every import to a real file on
 * disk, so a lint-a-string suite (see restricted-imports.test.ts) cannot
 * exercise it: this suite writes a small fixture tree under the real
 * (symlink-resolved) tmpdir and lints real files with the ACTUAL exported
 * `import-x/architecture-boundaries` block, found by name from
 * `buildGuardrails('app')`, never a hand-copied rule.
 *
 * The fixture is built twice: once at a plain root and once under a
 * dot-prefixed directory (mirroring `.claude/worktrees/<branch>`), because
 * import-x's `except` globs are matched with minimatch's default
 * `dot: false`, under which a `**`-leading pattern never crosses a
 * dot-prefixed path segment. Both roots are created under
 * `fs.realpathSync(os.tmpdir())`: on macOS `os.tmpdir()` is a `/var` symlink
 * to `/private/var`, and resolving through the symlink while `process.cwd()`
 * (which both import-x's basePath and guardrails.ts's `routesDir` read)
 * holds the unresolved path would make every `from` glob miss.
 *
 * `process.cwd()` is stubbed to each fixture root before the config is
 * (re)built for that root, because `routesDir` is computed once at
 * config-build time, and import-x's own `basePath` default is also read at
 * rule-creation time from `process.cwd()`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Linter} from 'eslint';
import {helpers, plugins} from 'eslint-config-airbnb-extended';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {buildGuardrails} from './guardrails.js';
import type {ESLint} from 'eslint';

const findBlock = (configs: Linter.Config[], name: string): Linter.Config => {
  const block = configs.find((config) => config.name === name);
  if (!block) {
    throw new Error(`config block "${name}" not found`);
  }
  return block;
};

const importXPlugins = plugins.importX.plugins as Record<string, ESLint.Plugin>;
const importXSettings = helpers.getImportSettings({
  javascript: false,
  jsx: true,
  typescript: true,
});

/** Route + importer fixture files shared by every case in this suite. */
const FIXTURE_FILES: Record<string, string> = {
  'app/routes/actions+/legacy.ts': 'export const action = () => null;\n',
  'app/routes/actions.probe.ts': 'export const action = () => null;\n',
  'app/routes/resources.probe.tsx': 'export const action = () => null;\n',
  'app/routes/_legal.privacy.tsx': 'export default () => null;\n',
};

const buildFixtureTree = (root: string): void => {
  for (const [relativePath, content] of Object.entries(FIXTURE_FILES)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), {recursive: true});
    fs.writeFileSync(absolutePath, content);
  }
  fs.mkdirSync(path.join(root, 'app/pages/Probe'), {recursive: true});
  fs.mkdirSync(path.join(root, 'app/components/Probe'), {recursive: true});
  fs.mkdirSync(path.join(root, 'app/hooks'), {recursive: true});
};

const IMPORTERS = {
  component: 'app/components/Probe/index.ts',
  hook: 'app/hooks/useProbe.ts',
  page: 'app/pages/Probe/index.ts',
} as const;

type Importer = keyof typeof IMPORTERS;

/**
 * Lints a fresh importer file (written with the given import specifier)
 * against the real `import-x/architecture-boundaries` block, with
 * `process.cwd()` stubbed to `root` for the duration of the config build and
 * the lint run.
 */
const lintImport = (
  root: string,
  importer: Importer,
  importSpecifier: string,
): Linter.LintMessage[] => {
  const importerPath = path.join(root, IMPORTERS[importer]);
  fs.writeFileSync(
    importerPath,
    `import {action} from '${importSpecifier}';\n\nexport {action};\n`,
  );

  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(root);
  try {
    const block = findBlock(
      buildGuardrails('app'),
      'import-x/architecture-boundaries',
    );
    const linter = new Linter({cwd: root});
    return linter.verify(
      fs.readFileSync(importerPath, 'utf8'),
      [
        {languageOptions: {ecmaVersion: 'latest', sourceType: 'module'}},
        {plugins: importXPlugins},
        {settings: importXSettings},
        block,
      ],
      importerPath,
    );
  } finally {
    cwdSpy.mockRestore();
  }
};

describe('import-x/architecture-boundaries data-endpoint carve-out', () => {
  const realTmp = fs.realpathSync(os.tmpdir());
  const suiteRoot = fs.mkdtempSync(path.join(realTmp, 'gaia-lint-carveout-'));
  const roots = {
    'dot-directory (.claude/worktrees/<branch> shape)': path.join(
      suiteRoot,
      '.wt',
      'branch',
    ),
    plain: path.join(suiteRoot, 'plain'),
  };

  beforeAll(() => {
    for (const root of Object.values(roots)) {
      buildFixtureTree(root);
    }
  });

  afterAll(() => {
    fs.rmSync(suiteRoot, {force: true, recursive: true});
  });

  describe.each(Object.entries(roots))('root: %s', (_label, root) => {
    test('component importing a flat resources.* route is exempt', () => {
      const messages = lintImport(root, 'component', '../../routes/resources.probe');
      expect(messages).toHaveLength(0);
    });

    test('component importing a flat actions.* route is exempt', () => {
      const messages = lintImport(root, 'component', '../../routes/actions.probe');
      expect(messages).toHaveLength(0);
    });

    test('page importing a flat resources.* route is exempt', () => {
      const messages = lintImport(root, 'page', '../../routes/resources.probe');
      expect(messages).toHaveLength(0);
    });

    test('hook importing a flat actions.* route is exempt', () => {
      const messages = lintImport(root, 'hook', '../routes/actions.probe');
      expect(messages).toHaveLength(0);
    });

    test('component importing an older actions+/ group folder is exempt (2.x dual spelling)', () => {
      const messages = lintImport(root, 'component', '../../routes/actions+/legacy');
      expect(messages).toHaveLength(0);
    });

    test('page importing a non-data route errors, message names the new spelling', () => {
      const messages = lintImport(root, 'page', '../../routes/_legal.privacy');
      expect(messages).toHaveLength(1);
      expect(messages[0]?.ruleId).toBe('import-x/no-restricted-paths');
      expect(messages[0]?.message).toMatch(/actions\.\*/);
      expect(messages[0]?.message).toMatch(/resources\.\*/);
    });

    test('component importing a non-data route errors', () => {
      const messages = lintImport(root, 'component', '../../routes/_legal.privacy');
      expect(messages).toHaveLength(1);
      expect(messages[0]?.ruleId).toBe('import-x/no-restricted-paths');
    });

    test('hook importing a non-data route errors', () => {
      const messages = lintImport(root, 'hook', '../routes/_legal.privacy');
      expect(messages).toHaveLength(1);
      expect(messages[0]?.ruleId).toBe('import-x/no-restricted-paths');
    });

    test('component importing a page still errors (non-route layers stay guarded in glob mode)', () => {
      const messages = lintImport(root, 'component', '../../pages/Probe');
      expect(messages).toHaveLength(1);
      expect(messages[0]?.ruleId).toBe('import-x/no-restricted-paths');
    });
  });
});

describe('regexp', () => {
  const linter = new Linter();
  const regexpBlock = findBlock(buildGuardrails('app'), 'regexp');

  const ruleIdsFor = (code: string): (string | null)[] =>
    linter
      .verify(code, [{...regexpBlock, files: ['**/*.js']}], 'probe.js')
      .map((message) => message.ruleId);

  test('a catastrophically backtracking pattern is reported', () => {
    expect(ruleIdsFor('export const pattern = /^(a+)+$/;\n')).toContain(
      'regexp/no-super-linear-backtracking',
    );
  });

  test('a safe pattern passes', () => {
    expect(ruleIdsFor('export const pattern = /^a+$/;\n')).toEqual([]);
  });
});
