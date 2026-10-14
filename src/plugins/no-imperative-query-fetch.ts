import type {ESLint, Rule} from 'eslint';

// Each banned TanStack Query method, mapped to the `queryClient` method a
// clientLoader awaits in its place.
const BANNED_METHODS = new Map([
  ['ensureInfiniteQueryData', 'infiniteQuery'],
  ['ensureQueryData', 'query'],
  ['fetchInfiniteQuery', 'infiniteQuery'],
  ['fetchQuery', 'query'],
  ['prefetchInfiniteQuery', 'infiniteQuery'],
  ['prefetchQuery', 'query'],
]);

const getPropertyName = (callee: Rule.Node): string | undefined => {
  if (callee.type !== 'MemberExpression') {
    return undefined;
  }

  const {computed, property} = callee;

  if (!computed && property.type === 'Identifier') {
    return property.name;
  }

  if (
    computed &&
    property.type === 'Literal' &&
    typeof property.value === 'string'
  ) {
    return property.value;
  }

  return undefined;
};

const noImperativeQueryFetchRule: Rule.RuleModule = {
  create: (context) => ({
    CallExpression: (node) => {
      const method = getPropertyName(node.callee as Rule.Node);
      const replacement = method && BANNED_METHODS.get(method);

      if (method && replacement) {
        context.report({
          data: {method, replacement},
          messageId: 'banned',
          node,
        });
      }
    },
  }),
  meta: {
    docs: {
      description:
        'Disallow imperative TanStack Query fetches; await queryClient.query in a clientLoader and read with useSuspenseQuery',
    },
    messages: {
      banned:
        '`{{method}}` is banned. Await `queryClient.{{replacement}}(options)` in a clientLoader and read the data with `useSuspenseQuery(options)` in the component.',
    },
    schema: [],
    type: 'problem',
  },
};

const plugin: ESLint.Plugin = {
  meta: {
    name: 'no-imperative-query-fetch',
    version: '0.1.0',
  },
  rules: {
    'no-imperative-query-fetch': noImperativeQueryFetchRule,
  },
};

export default plugin;
