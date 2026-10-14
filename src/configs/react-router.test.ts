/**
 * Composition suite for the optional `reactRouter` block.
 *
 * The risk this guards is a silent one. `reactRouter` is SUBTRACTIVE (it
 * turns `no-empty-pattern` off) and its glob, `**\/routes/**\/*.tsx`, is not
 * unique to React Router. Folding it back into `react` (or widening its
 * scope) would quietly relax the rule for every file-based router that ships
 * a `routes/` directory, and nothing would fail. So this asks ESLint itself
 * what the composed config resolves to, on both sides of the opt-in.
 *
 * `calculateConfigForFile` computes config only; it never parses the file, so
 * the paths below do not need to exist.
 */
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {describe, expect, test} from 'vitest';
import {buildBase} from './base.js';
import {react} from './react.js';
import {buildReactRouter} from './react-router.js';

const ROUTE = 'app/routes/_public+/terms.tsx';
const COMPONENT = 'app/components/Button/index.tsx';

const severityOf = async (
  config: ESLint.Options['overrideConfig'],
  file: string,
  rule: string,
): Promise<number> => {
  const eslint = new ESLint({overrideConfig: config, overrideConfigFile: true});
  const resolved = await eslint.calculateConfigForFile(file);
  const entry = resolved.rules[rule] as [number, ...unknown[]] | undefined;
  return entry ? entry[0] : 0;
};

const withoutRouter = [...buildBase('app'), ...react];
const withRouter = [...withoutRouter, ...buildReactRouter('app')];

const QUERY_FETCH_RULE = 'no-imperative-query-fetch/no-imperative-query-fetch';

describe('reactRouter', () => {
  test('no-empty-pattern is ON for route files without the opt-in', async () => {
    expect(await severityOf(withoutRouter, ROUTE, 'no-empty-pattern')).toBe(2);
  });

  test('no-empty-pattern is OFF for route files with the opt-in', async () => {
    expect(await severityOf(withRouter, ROUTE, 'no-empty-pattern')).toBe(0);
  });

  test('the relaxation does not leak outside routes/', async () => {
    expect(await severityOf(withRouter, COMPONENT, 'no-empty-pattern')).toBe(2);
  });

  test('no-imperative-query-fetch is ON across the source dir, tests and stories included', async () => {
    for (const file of [
      ROUTE,
      COMPONENT,
      'app/services/items/queries.ts',
      'app/components/Button/tests/index.stories.tsx',
      'app/utils/tests/format.test.ts',
    ]) {
      expect(await severityOf(withRouter, file, QUERY_FETCH_RULE)).toBe(2);
    }
  });

  test('no-imperative-query-fetch stays inside the source dir', async () => {
    expect(
      await severityOf(withRouter, 'test/setup.ts', QUERY_FETCH_RULE),
    ).toBe(0);
  });

  test('no-imperative-query-fetch follows a custom sourceDir', async () => {
    const custom = [...buildBase('src'), ...react, ...buildReactRouter('src')];
    expect(await severityOf(custom, 'src/routes/home.tsx', QUERY_FETCH_RULE)).toBe(2);
    expect(await severityOf(custom, 'app/routes/home.tsx', QUERY_FETCH_RULE)).toBe(0);
  });

  test('react alone carries no router-specific block', () => {
    expect(react.some((block) => block.name?.startsWith('react-router/'))).toBe(
      false,
    );
  });
});

describe('react-refresh/only-export-components', () => {
  const eslint = new ESLint({
    overrideConfig: [
      ...withRouter,
      tseslint.configs.disableTypeChecked as Linter.Config,
      {
        languageOptions: {
          parserOptions: {project: null, projectService: false},
        },
      },
    ],
    overrideConfigFile: true,
  });

  const RULE = 'react-refresh/only-export-components';

  const refreshHits = async (code: string, filePath: string): Promise<number> => {
    const [result] = await eslint.lintText(code, {filePath});
    return result.messages.filter((message) => message.ruleId === RULE).length;
  };

  const MIXED = [
    'export const formatLabel = (label: string) => label.trim();',
    'const Label = () => <span>label</span>;',
    'export default Label;',
    '',
  ].join('\n');

  const ROUTE_MODULE = [
    'export const loader = async () => ({ok: true});',
    'export const meta = () => [{title: "Terms"}];',
    'const Terms = () => <main>terms</main>;',
    'export default Terms;',
    '',
  ].join('\n');

  test('a component file that also exports a helper is reported', async () => {
    expect(await refreshHits(MIXED, COMPONENT)).toBe(1);
  });

  test('a route module may export loader and meta beside its component', async () => {
    expect(await refreshHits(ROUTE_MODULE, ROUTE)).toBe(0);
  });

  test('root.tsx is a route module too', async () => {
    expect(await refreshHits(ROUTE_MODULE, 'app/root.tsx')).toBe(0);
  });

  test('route-module names are not exempt outside route modules', async () => {
    expect(await refreshHits(ROUTE_MODULE, COMPONENT)).toBe(2);
  });

  test('stories and tests are exempt, inside routes/ too', async () => {
    expect(
      await refreshHits(MIXED, 'app/components/Button/tests/index.stories.tsx'),
    ).toBe(0);
    expect(
      await refreshHits(MIXED, 'app/routes/tests/terms.test.tsx'),
    ).toBe(0);
    expect(
      await refreshHits(MIXED, 'app/components/form/tests/fixture-form.tsx'),
    ).toBe(0);
  });
});
