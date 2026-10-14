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
import {ESLint} from 'eslint';
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
