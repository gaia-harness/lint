import type {ESLint, Rule} from 'eslint';
import unicorn from 'eslint-plugin-unicorn';

// Playwright methods whose function argument is serialized and run in the
// page, where `CSS.escape` exists.
const BROWSER_CALLBACK_METHODS = new Set([
  '$$eval',
  '$eval',
  'addInitScript',
  'evaluate',
  'evaluateAll',
  'evaluateHandle',
  'waitForFunction',
]);

type EstreeNode = ReturnType<
  Rule.RuleContext['sourceCode']['getAncestors']
>[number];

// `ancestors` runs from the root down, so a node's parent sits just before it.
const isBrowserCallback = (
  node: EstreeNode,
  index: number,
  ancestors: EstreeNode[],
): boolean => {
  if (
    node.type !== 'ArrowFunctionExpression' &&
    node.type !== 'FunctionExpression'
  ) {
    return false;
  }
  const call = ancestors[index - 1];
  return (
    call?.type === 'CallExpression' &&
    call.arguments.includes(node) &&
    call.callee.type === 'MemberExpression' &&
    call.callee.property.type === 'Identifier' &&
    BROWSER_CALLBACK_METHODS.has(call.callee.property.name)
  );
};

const unicornRule = unicorn.rules?.['require-css-escape'] as Rule.RuleModule;

/**
 * `unicorn/require-css-escape`, reporting only inside functions Playwright
 * runs in the browser. The rest of a spec runs in Node, where `CSS` is
 * undefined and the rule's autofix would crash it.
 */
const browserCallbackCssEscapeRule: Rule.RuleModule = {
  create: (context) =>
    unicornRule.create(
      Object.create(context, {
        report: {
          value: (descriptor: Rule.ReportDescriptor) => {
            if (
              'node' in descriptor &&
              context.sourceCode
                .getAncestors(descriptor.node)
                .some(isBrowserCallback)
            ) {
              context.report(descriptor);
            }
          },
        },
      }) as Rule.RuleContext,
    ),
  meta: {
    ...unicornRule.meta,
    docs: {
      description:
        'Require `CSS.escape()` for interpolated selectors inside Playwright browser callbacks',
    },
  },
};

const plugin: ESLint.Plugin = {
  meta: {
    name: 'browser-callback-css-escape',
    version: '0.1.0',
  },
  rules: {
    'require-css-escape': browserCallbackCssEscapeRule,
  },
};

export default plugin;
