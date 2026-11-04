/**
 * The curated react-doctor rules: each one resolves at its severity in the
 * block that owns it, the scoped and opt-in ones stay out of the file classes
 * and compositions they must not reach, and one probe per owning block proves
 * the plugin reports through the real composed bundle. The two `shadcn()`
 * rules are covered in `shadcn.test.ts`.
 *
 * `calculateConfigForFile` computes config only; it never parses the file, so
 * the paths below do not need to exist.
 */
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {describe, expect, test} from 'vitest';
import gaiaLint from '../index.js';

const lint = gaiaLint();
const RD = 'react-doctor/';

const COMPONENT = 'app/components/probe/index.tsx';
const ROUTE = 'app/routes/_public._index.tsx';
const HOOK = 'app/hooks/use-probe.ts';
const SERVICE = 'app/services/items/queries.ts';
const TEST = 'app/components/probe/tests/index.test.tsx';
const STORY = 'app/components/probe/tests/index.stories.tsx';
const PLAYWRIGHT = '.playwright/e2e/probe.spec.ts';

const UNTYPED: Linter.Config[] = [
  tseslint.configs.disableTypeChecked as Linter.Config,
  {languageOptions: {parserOptions: {project: null, projectService: false}}},
];

/**
 * Everything but `shadcn()`, which needs the full composition and a Tailwind
 * fixture before it; its two react-doctor rules are covered in
 * `shadcn.test.ts`, which already builds both.
 */
const FULL: Linter.Config[] = [
  ...lint.base,
  ...lint.react,
  ...lint.reactRouter,
  ...lint.guardrails,
];

const WITHOUT_ROUTER: Linter.Config[] = [
  ...lint.base,
  ...lint.react,
  ...lint.guardrails,
];

const severityOf = async (
  config: Linter.Config[],
  file: string,
  rule: string,
): Promise<number> => {
  const eslint = new ESLint({overrideConfig: config, overrideConfigFile: true});
  const resolved = await eslint.calculateConfigForFile(file);
  const entry = resolved.rules[rule] as [number, ...unknown[]] | number | undefined;
  if (entry === undefined) return 0;
  return Array.isArray(entry) ? entry[0] : entry;
};

const WARN = 1;
const ERROR = 2;

/**
 * Literal expectations, written out here rather than read from
 * `react-doctor.ts`, so a dropped rule or a changed severity fails. Every rule
 * from the first batch, plus at least one per group added later.
 */

/** Rules owned by `react`: every TS/JS file. */
const REACT_RULES: Record<string, number> = {
  // SSR and hydration
  'no-hydration-branch-on-browser-global': ERROR,
  'no-locale-format-in-render': WARN,
  'no-match-media-in-state-initializer': WARN,
  'no-unguarded-browser-global-in-render-or-hook-init': ERROR,
  // HTML validity
  'form-control-requires-name': WARN,
  'html-no-invalid-paragraph-child': WARN,
  'html-no-nested-form': WARN,
  'html-no-nested-interactive': WARN,
  // a11y
  'no-blocked-paste': ERROR,
  'no-hover-only-reveal': WARN,
  'no-multiple-main-landmarks': WARN,
  'no-responsive-hidden-accessible-name': WARN,
  'no-skipped-heading-level': WARN,
  // render and state purity
  'no-create-context-in-render': ERROR,
  'no-side-effect-in-state-updater-function': WARN,
  // Effect lifecycle
  'no-fetch-in-effect': WARN,
  'no-fetch-response-used-without-status-check': WARN,
  'no-set-state-after-await-in-effect': WARN,
  // performance, images and scripts
  'async-parallel': WARN,
  'no-img-without-dimensions': WARN,
  'rendering-script-defer-async': WARN,
  'rerender-lazy-state-init': WARN,
  // motion and font
  'no-ungated-tailwind-animation': WARN,
  // size and complexity
  'no-giant-component': WARN,
  'no-high-complexity-react-function': WARN,
};

/** Rules owned by `reactRouter`: every TS file under the source dir. */
const REACT_ROUTER_RULES: Record<string, number> = {
  'react-router-internal-route-anchor': WARN,
  'react-router-loader-parallel-fetch': WARN,
  'react-router-no-catch-middleware-next': WARN,
  'react-router-no-client-module-in-server-render': ERROR,
  'react-router-no-loader-request-body': ERROR,
  'react-router-no-redirect-in-try-catch': ERROR,
  'react-router-no-use-loader-data-in-error-ui': ERROR,
  'react-router-session-mutation-requires-commit': ERROR,
};

/** react-doctor Query rules, in `reactRouter`'s Query block. */
const QUERY_RULES: Record<string, number> = {
  'query-mutation-missing-invalidation': WARN,
  'query-no-query-in-effect': WARN,
};

/** react-doctor Query rules the official TanStack plugin owns instead. */
const QUERY_RULES_OWNED_BY_TANSTACK = [
  'query-no-rest-destructuring',
  'query-no-void-query-fn',
  'query-stable-query-client',
];

/** `@tanstack/eslint-plugin-query` recommended, in the Query block. */
const TANSTACK_RULES: Record<string, number> = {
  '@tanstack/query/exhaustive-deps': ERROR,
  '@tanstack/query/infinite-query-property-order': ERROR,
  '@tanstack/query/mutation-property-order': ERROR,
  '@tanstack/query/no-rest-destructuring': WARN,
  '@tanstack/query/no-unstable-deps': ERROR,
  '@tanstack/query/no-void-query-fn': ERROR,
  '@tanstack/query/stable-query-client': ERROR,
};

/** Owned by `reactRouter`, source files only (no tests, stories, e2e). */
const MODULE_SCOPE_RULE = 'no-unguarded-browser-global-at-module-scope';

/** Rules owned by `guardrails`: every TS/JS file. */
const GUARDRAIL_RULES: Record<string, number> = {
  'auth-token-in-web-storage': WARN,
  'no-non-null-assertion-on-maybe-undefined-result': WARN,
  'no-path-prefix-containment': WARN,
  'no-secrets-in-client-code': WARN,
  'no-unescaped-dynamic-string-in-regexp': WARN,
  'window-open-without-noopener': WARN,
};

/** 125 curated rules minus the four `shadcn()` owns. */
const NON_SHADCN_RULE_COUNT = 121;

const enabledReactDoctorRules = async (
  config: Linter.Config[],
  file: string,
): Promise<string[]> => {
  const eslint = new ESLint({overrideConfig: config, overrideConfigFile: true});
  const resolved = await eslint.calculateConfigForFile(file);
  return Object.entries(resolved.rules as Linter.RulesRecord)
    .filter(([rule]) => rule.startsWith(RD))
    .filter(([, entry]) => {
      const severity = Array.isArray(entry) ? entry[0] : entry;
      return severity !== 0 && severity !== 'off';
    })
    .map(([rule]) => rule);
};

describe('react-doctor rule severities', () => {
  test(`exactly ${NON_SHADCN_RULE_COUNT} curated non-shadcn rules, no preset`, async () => {
    const enabled = await enabledReactDoctorRules(FULL, COMPONENT);
    expect(enabled).toHaveLength(NON_SHADCN_RULE_COUNT);
    expect(enabled).toEqual(
      expect.arrayContaining(
        [
          ...Object.keys(REACT_RULES),
          ...Object.keys(REACT_ROUTER_RULES),
          ...Object.keys(QUERY_RULES),
          MODULE_SCOPE_RULE,
          ...Object.keys(GUARDRAIL_RULES),
        ].map((rule) => `${RD}${rule}`),
      ),
    );
  });

  test('the Query rules the official TanStack plugin owns stay off', async () => {
    const enabled = await enabledReactDoctorRules(FULL, COMPONENT);
    for (const rule of QUERY_RULES_OWNED_BY_TANSTACK) {
      expect(enabled).not.toContain(`${RD}${rule}`);
    }
  });

  test('the TanStack Query recommended rules are on across the source dir', async () => {
    for (const [rule, severity] of Object.entries(TANSTACK_RULES)) {
      for (const file of [COMPONENT, ROUTE, SERVICE, TEST]) {
        expect(await severityOf(FULL, file, rule), `${rule} at ${file}`).toBe(
          severity,
        );
      }
    }
  });

  test('the TanStack Query rules are absent without reactRouter', async () => {
    for (const rule of Object.keys(TANSTACK_RULES)) {
      expect(await severityOf(WITHOUT_ROUTER, COMPONENT, rule)).toBe(0);
    }
  });

  for (const [rule, severity] of Object.entries({
    ...REACT_RULES,
    ...REACT_ROUTER_RULES,
    ...QUERY_RULES,
    ...GUARDRAIL_RULES,
  })) {
    test(`${rule} is ${severity === ERROR ? 'error' : 'warn'} on components, routes and hooks`, async () => {
      for (const file of [COMPONENT, ROUTE, HOOK]) {
        expect(await severityOf(FULL, file, `${RD}${rule}`)).toBe(severity);
      }
    });
  }

  test(`${MODULE_SCOPE_RULE} is warn on source files`, async () => {
    for (const file of [COMPONENT, ROUTE, HOOK, SERVICE]) {
      expect(await severityOf(FULL, file, `${RD}${MODULE_SCOPE_RULE}`)).toBe(
        WARN,
      );
    }
  });

  test(`${MODULE_SCOPE_RULE} stays off tests, stories and Playwright`, async () => {
    for (const file of [TEST, STORY, PLAYWRIGHT]) {
      expect(await severityOf(FULL, file, `${RD}${MODULE_SCOPE_RULE}`)).toBe(0);
    }
  });

  test('reactRouter rules are absent without the opt-in', async () => {
    for (const rule of [
      ...Object.keys(REACT_ROUTER_RULES),
      ...Object.keys(QUERY_RULES),
      MODULE_SCOPE_RULE,
    ]) {
      expect(await severityOf(WITHOUT_ROUTER, COMPONENT, `${RD}${rule}`)).toBe(
        0,
      );
    }
  });

  test('react and guardrails rules hold without the reactRouter opt-in', async () => {
    for (const [rule, severity] of Object.entries({
      ...REACT_RULES,
      ...GUARDRAIL_RULES,
    })) {
      expect(await severityOf(WITHOUT_ROUTER, COMPONENT, `${RD}${rule}`)).toBe(
        severity,
      );
    }
  });
});

describe('react-doctor capabilities', () => {
  test('reactRouter declares the framework-mode capabilities on source files', async () => {
    const eslint = new ESLint({overrideConfig: FULL, overrideConfigFile: true});
    const resolved = (await eslint.calculateConfigForFile(ROUTE)) as Linter.Config;
    const capabilities = (
      resolved.settings?.['react-doctor'] as {capabilities?: string[]} | undefined
    )?.capabilities;
    expect(capabilities).toEqual(
      expect.arrayContaining([
        'react',
        'react-router:6.4',
        'react-router:7',
        'react-router:7.9',
        'react-router-framework',
        'react:19',
        'ssr',
        'tailwind',
      ]),
    );
  });

  test('without reactRouter no capabilities are declared', async () => {
    const eslint = new ESLint({
      overrideConfig: WITHOUT_ROUTER,
      overrideConfigFile: true,
    });
    const resolved = (await eslint.calculateConfigForFile(ROUTE)) as Linter.Config;
    expect(resolved.settings?.['react-doctor']).toBeUndefined();
  });
});

describe('react/jsx-key', () => {
  test('is error with fragment shorthand and duplicate checks', async () => {
    const eslint = new ESLint({overrideConfig: FULL, overrideConfigFile: true});
    const resolved = await eslint.calculateConfigForFile(COMPONENT);
    expect(resolved.rules['react/jsx-key']).toMatchObject([
      ERROR,
      {checkFragmentShorthand: true, warnOnDuplicates: true},
    ]);
  });
});

describe('react-doctor probes through the composed bundle', () => {
  const eslint = new ESLint({
    overrideConfig: [...FULL, ...UNTYPED],
    overrideConfigFile: true,
  });

  const ruleIdsFor = async (code: string, file = COMPONENT): Promise<string[]> => {
    const [result] = await eslint.lintText(code, {filePath: file});
    return result.messages.map((message) => message.ruleId ?? '');
  };

  test('react: fetch inside an Effect is reported', async () => {
    const code = [
      "import {useEffect, useState} from 'react';",
      '',
      'const Probe = () => {',
      '  const [data, setData] = useState<unknown>(null);',
      '  useEffect(() => {',
      "    void fetch('/api').then(async (response) => setData(await response.json()));",
      '  }, []);',
      '',
      '  return <p>{String(data)}</p>;',
      '};',
      '',
      'export default Probe;',
      '',
    ].join('\n');
    expect(await ruleIdsFor(code)).toContain(`${RD}no-fetch-in-effect`);
  });

  test('react: a missing list key is reported', async () => {
    const code = [
      'const Probe = ({items}: {items: string[]}) => (',
      '  <ul>',
      '    {items.map((item) => (',
      '      <li>{item}</li>',
      '    ))}',
      '  </ul>',
      ');',
      '',
      'export default Probe;',
      '',
    ].join('\n');
    expect(await ruleIdsFor(code)).toContain('react/jsx-key');
  });

  test('reactRouter: a redirect thrown inside try/catch is reported', async () => {
    const code = [
      "import {redirect} from 'react-router';",
      '',
      'export const loader = async () => {',
      '  try {',
      "    throw redirect('/login');",
      '  } catch (error) {',
      '    console.error(error);',
      '  }',
      '',
      '  return null;',
      '};',
      '',
    ].join('\n');
    expect(await ruleIdsFor(code, ROUTE)).toContain(
      `${RD}react-router-no-redirect-in-try-catch`,
    );
  });

  test('reactRouter: useLoaderData in an exported ErrorBoundary is reported', async () => {
    const code = [
      "import {useLoaderData} from 'react-router';",
      '',
      'export const ErrorBoundary = () => {',
      '  const data = useLoaderData();',
      '',
      '  return <p>{String(data)}</p>;',
      '};',
      '',
      'const Route = () => <p />;',
      '',
      'export default Route;',
      '',
    ].join('\n');
    expect(await ruleIdsFor(code, ROUTE)).toContain(
      `${RD}react-router-no-use-loader-data-in-error-ui`,
    );
  });

  test('guardrails: window.open without noopener is reported', async () => {
    const code = [
      'export const openDocs = (url: string) => {',
      "  window.open(url, '_blank');",
      '};',
      '',
    ].join('\n');
    expect(await ruleIdsFor(code, SERVICE)).toContain(
      `${RD}window-open-without-noopener`,
    );
  });

  test('guardrails: an auth token written to localStorage is reported', async () => {
    const code = [
      'export const saveToken = (token: string) => {',
      "  localStorage.setItem('authToken', token);",
      '};',
      '',
    ].join('\n');
    expect(await ruleIdsFor(code, SERVICE)).toContain(
      `${RD}auth-token-in-web-storage`,
    );
  });
});

describe('TanStack Query option order and perfectionist', () => {
  const eslint = new ESLint({
    overrideConfig: [
      ...lint.base,
      ...lint.react,
      ...lint.reactRouter,
      ...lint.styleHygiene,
      ...lint.guardrails,
      ...UNTYPED,
    ],
    overrideConfigFile: true,
  });

  const mutation = (order: string[]): string =>
    [
      "import {useMutation} from '@tanstack/react-query';",
      '',
      'export const useSave = (save: () => Promise<void>) =>',
      '  useMutation({',
      ...order.map((line) => `    ${line},`),
      '  });',
      '',
    ].join('\n');

  const ruleIdsFor = async (code: string): Promise<string[]> => {
    const [result] = await eslint.lintText(code, {filePath: HOOK});
    return result.messages.map((message) => message.ruleId ?? '');
  };

  test('onMutate before onError passes both TanStack and perfectionist', async () => {
    const ids = await ruleIdsFor(
      mutation([
        'mutationFn: save',
        'onMutate: () => undefined',
        'onError: () => undefined',
      ]),
    );
    expect(ids).not.toContain('@tanstack/query/mutation-property-order');
    expect(ids).not.toContain('perfectionist/sort-objects');
  });

  test('onError before onMutate is reported by the TanStack order rule', async () => {
    const ids = await ruleIdsFor(
      mutation([
        'mutationFn: save',
        'onError: () => undefined',
        'onMutate: () => undefined',
      ]),
    );
    expect(ids).toContain('@tanstack/query/mutation-property-order');
  });

  test('objects outside the TanStack calls keep the natural sort', async () => {
    const code = 'export const options = {zeta: 1, alpha: 2};\n';
    expect(await ruleIdsFor(code)).toContain('perfectionist/sort-objects');
  });
});
