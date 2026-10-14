/**
 * RuleTester suite for the `no-imperative-query-fetch` rule.
 *
 * The rule matches any member call by property name, so default espree parses
 * every case. It is report-only (no autofix), so no `output` is asserted.
 */
import {RuleTester} from 'eslint';
import {describe, it} from 'vitest';
import noImperativeQueryFetchPlugin from './no-imperative-query-fetch.js';

// Route RuleTester's case registration through vitest for per-case reporting.
RuleTester.describe = describe;
RuleTester.it = it;

const noImperativeQueryFetchRule =
  noImperativeQueryFetchPlugin.rules!['no-imperative-query-fetch'];

const BANNED_METHODS = [
  'ensureQueryData',
  'fetchQuery',
  'prefetchQuery',
  'ensureInfiniteQueryData',
  'fetchInfiniteQuery',
  'prefetchInfiniteQuery',
];

const buildExpectedError = (method: string) => ({
  message: new RegExp(
    String.raw`${method}.*queryClient\.(query|infiniteQuery).*clientLoader.*useSuspenseQuery`,
  ),
});

const invalid = BANNED_METHODS.flatMap((method) => [
  {
    code: `queryClient.${method}(options);`,
    errors: [buildExpectedError(method)],
  },
  {
    code: `useQueryClient().${method}(options);`,
    errors: [buildExpectedError(method)],
  },
  {
    code: `queryClient?.${method}(options);`,
    errors: [buildExpectedError(method)],
  },
  {
    code: `queryClient['${method}'](options);`,
    errors: [buildExpectedError(method)],
  },
  {
    code: `this.client.${method}(options);`,
    errors: [buildExpectedError(method)],
  },
]);

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-imperative-query-fetch', noImperativeQueryFetchRule, {
  invalid,
  valid: [
    // The prescribed replacement.
    'queryClient.query(options);',
    // Other queryClient methods are untouched.
    'queryClient.invalidateQueries({queryKey: keys.all});',
    'queryClient.getQueryData(key);',
    // A bare call whose name only contains a banned method.
    'fetchQueryParams();',
    // A computed property that is not a string literal cannot be resolved.
    'queryClient[methodName](options);',
  ],
});
