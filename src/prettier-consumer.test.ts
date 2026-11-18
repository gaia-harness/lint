/**
 * Consumer-install check for the `./prettier` export. Prettier resolves a
 * plugin named by a bare package name from the consumer's working directory,
 * and pnpm's strict `node_modules` exposes only a project's direct
 * dependencies there, so a plugin this package depends on must reach Prettier
 * as a path resolved from this package's own location.
 *
 * The fixture is a real consumer: this package's packed tarball (the same
 * files a registry install gets, so it exercises `dist`, not `src`) plus
 * Prettier, installed by pnpm with hoisting off and without
 * `prettier-plugin-tailwindcss`. Run `pnpm build` first; CI builds before it
 * tests. A child Node process formats from inside the fixture, so the
 * resolution starts from the consumer root, not from this repository.
 */
import {execFile} from 'node:child_process';
import {mkdtemp, readdir, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const PRETTIER_VERSION = (require('prettier/package.json') as {version: string})
  .version;

const SOURCE = "const a = {b: 1};\ncn('text-white px-2 bg-red-500');\n";

// The child formats one file against one config file and prints the result
// and anything Prettier warned, such as "Ignored unknown option".
const FORMAT_SCRIPT = `
import {format, resolveConfig} from 'prettier';
const [config, filepath, source] = process.argv.slice(2);
const warnings = [];
console.warn = (...parts) => warnings.push(parts.join(' '));
const options = await resolveConfig(filepath, {config});
const output = await format(source, {...options, filepath});
process.stdout.write(JSON.stringify({output, warnings}));
`;

let fixture = '';

const formatInFixture = async (
  configFile: string
): Promise<{output: string; warnings: string[]}> => {
  const {stdout} = await run(
    process.execPath,
    [
      'format.mjs',
      path.join(fixture, configFile),
      path.join(fixture, 'input.ts'),
      SOURCE,
    ],
    {cwd: fixture}
  );

  return JSON.parse(stdout) as {output: string; warnings: string[]};
};

beforeAll(async () => {
  fixture = await mkdtemp(path.join(tmpdir(), 'gaia-lint-prettier-'));
  await run('pnpm', ['pack', '--pack-destination', fixture], {
    cwd: REPO_ROOT,
  });
  const tarball = (await readdir(fixture)).find((name) =>
    name.endsWith('.tgz')
  );

  if (!tarball) throw new Error('pnpm pack produced no tarball');

  await writeFile(
    path.join(fixture, 'package.json'),
    JSON.stringify({
      devDependencies: {
        '@gaia-harness/lint': `file:./${tarball}`,
        prettier: PRETTIER_VERSION,
      },
      name: 'prettier-consumer-fixture',
      private: true,
      type: 'module',
    })
  );
  // Strict layout: nothing hoisted, so only direct dependencies are visible
  // from the consumer root.
  await writeFile(
    path.join(fixture, 'pnpm-workspace.yaml'),
    'hoist: false\npublicHoistPattern: []\nnodeLinker: isolated\n'
  );
  await writeFile(
    path.join(fixture, 'prettier.config.mjs'),
    "export {default} from '@gaia-harness/lint/prettier';\n"
  );
  await writeFile(
    path.join(fixture, 'prettier.no-tailwind.mjs'),
    "import {prettierConfig} from '@gaia-harness/lint/prettier';\n\nexport default prettierConfig({tailwind: false});\n"
  );
  await writeFile(path.join(fixture, 'format.mjs'), FORMAT_SCRIPT);
  await run(
    'pnpm',
    ['install', '--prefer-offline', '--ignore-scripts', '--reporter=silent'],
    {cwd: fixture}
  );
}, 300_000);

afterAll(async () => {
  if (fixture) await rm(fixture, {force: true, recursive: true});
});

describe('prettier export in a strict pnpm consumer', () => {
  it('formats with the default export and sorts Tailwind classes', async () => {
    const {output, warnings} = await formatInFixture('prettier.config.mjs');

    expect(output).toBe(
      "const a = {b: 1};\ncn('bg-red-500 px-2 text-white');\n"
    );
    expect(warnings).toStrictEqual([]);
  });

  it('formats with prettierConfig({tailwind: false}) and leaves classes alone', async () => {
    const {output, warnings} = await formatInFixture(
      'prettier.no-tailwind.mjs'
    );

    expect(output).toBe(
      "const a = {b: 1};\ncn('text-white px-2 bg-red-500');\n"
    );
    expect(warnings).toStrictEqual([]);
  });
});
