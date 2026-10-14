import js from '@eslint/js';
import {configs, plugins, rules} from 'eslint-config-airbnb-extended';
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions';
import lodashUnderscore from 'eslint-plugin-you-dont-need-lodash-underscore';
import {RESTRICTED_IMPORT_PATHS} from './restricted-imports.js';
import type {ESLint, Linter} from 'eslint';

const jsConfig: Linter.Config[] = [
  // ESLint recommended config
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  // Stylistic plugin
  plugins.stylistic,
  // Import X plugin
  plugins.importX,
  // Airbnb base recommended config
  ...configs.base.recommended,
  // Strict import rules
  rules.base.importsStrict,
];

const jsCustomConfig: Linter.Config[] = [
  {
    name: 'js-custom',
    rules: {
      'consistent-return': 'off',
      curly: ['error', 'all'],
      'max-params': 'error',
      'no-param-reassign': 'off', // handled by sonarjs
      'no-undef': 'off',
      'no-unused-vars': 'off', // handled by sonarjs
    },
  },
  {
    files: ['**/*.test.ts?(x)', '**/*.stories.ts?(x)'],
    name: 'test-files/all',
    rules: {
      'guard-for-in': 'off',
      'max-params': 'off',
      'no-await-in-loop': 'off',
      'no-plusplus': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['.playwright/**/*.ts?(x)'],
    name: 'playwright/all',
    rules: {
      'no-await-in-loop': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];

const typescriptConfig: Linter.Config[] = [
  // TypeScript ESLint plugin
  plugins.typescriptEslint,
  // Airbnb base TypeScript config
  ...configs.base.typescript,
  // Strict TypeScript rules
  rules.typescript.typescriptEslintStrict,
  rules.typescript.stylistic,
  // Airbnb React TypeScript config
  ...configs.react.typescript,
  {
    files: ['./*.ts'],
    name: 'root-ts-files',
    rules: {
      'global-require': 'off',
      'no-void': 'off',
    },
  },
  {
    files: ['**/*.ts?(x)'],
    name: 'no-void',
    rules: {
      'no-void': ['error', {allowAsStatement: true}],
    },
  },
];

const buildTsEslintConfig = (sourceDir: string): Linter.Config[] => [
  {
    files: ['**/*.ts?(x)'],
    name: 'typescript/config',
    rules: {
      '@typescript-eslint/array-type': ['error', {default: 'array'}],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          minimumDescriptionLength: 10,
          'ts-check': false,
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        {ignoreArrowShorthand: true},
      ],
      '@typescript-eslint/no-floating-promises': [
        'error',
        {ignoreIIFE: true, ignoreVoid: true},
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {checksVoidReturn: false},
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {allowBoolean: true, allowNumber: true},
      ],
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: [
      `${sourceDir}/utils/**`,
      `${sourceDir}/services/**`,
      `${sourceDir}/hooks/**`,
    ],
    name: 'typescript/explicit-return-types',
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
  {
    files: ['**/*.test.ts?(x)', '**/*.stories.ts?(x)'],
    name: 'typescript/test-files',
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    files: ['test/**/*.ts?(x)'],
    name: 'typescript/test-config',
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-plusplus': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    name: 'typescript/type-definitions',
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];

// `^virtual:` covers Vite plugin virtual modules (`virtual:msw` and the like),
// which no resolver can find on disk.
const NO_UNRESOLVED: Linter.RuleEntry = [
  'error',
  {caseSensitive: true, commonjs: true, ignore: ['^virtual:']},
];

const buildImportXConfig = (sourceDir: string): Linter.Config[] => [
  {
    name: 'import-x-all-files',
    rules: {
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import-x/extensions': 'off',
      'import-x/no-anonymous-default-export': [
        'error',
        {
          allowArray: true,
          allowLiteral: true,
          allowObject: true,
        },
      ],
      'import-x/no-namespace': 'off',
      'import-x/no-rename-default': 'off',
      'import-x/no-useless-path-segments': 'off',
      'import-x/order': 'off',
      'import-x/prefer-default-export': 'off',
    },
  },
  {
    files: ['./*.ts'],
    name: 'import-x/root-ts-files',
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/no-unresolved': NO_UNRESOLVED,
      'import-x/prefer-default-export': 'off',
    },
  },
  {
    files: ['**/*.test.ts?(x)', '**/*.stories.ts?(x)'],
    name: 'import-x/test-files',
    rules: {
      'import-x/extensions': 'off',
      'import-x/no-extraneous-dependencies': 'off',
    },
  },
  {
    files: [`${sourceDir}/**/*.ts?(x)`],
    name: 'import-x/app-test-files',
    rules: {
      'import-x/no-unresolved': NO_UNRESOLVED,
    },
  },
  {
    files: [`${sourceDir}/**/hooks/*.ts?(x)`],
    name: 'import-x/hooks',
    rules: {
      'import-x/no-default-export': 'error',
    },
  },
  {
    files: ['test/**/*.ts?(x)'],
    name: 'import-x/test-config-files',
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/prefer-default-export': 'off',
    },
  },
  {
    files: ['.storybook/**/*.ts?(x)', '.playwright/**/*.ts?(x)'],
    name: 'import-x/storybook-playwright',
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/no-unresolved': 'off',
    },
  },
];

// ESLint's built-in directive check, at error so an unused disable fails a
// plain `eslint` run, not only one with `--max-warnings=0`. The eslint-comments
// plugin's `no-unused-disable` cannot stand in for it: it looks its severity up
// under the `@eslint-community/eslint-comments/` prefix, so registered under any
// other plugin name it never reports.
const unusedDisableDirectivesConfig: Linter.Config[] = [
  {
    linterOptions: {reportUnusedDisableDirectives: 'error'},
    name: 'gaia/unused-disable-directives',
  },
];

const preferArrowFunctionsConfig: Linter.Config[] = [
  {
    name: 'prefer-arrow',
    plugins: {
      'prefer-arrow-functions': preferArrowFunctions as unknown as ESLint.Plugin,
    },
    rules: {
      'prefer-arrow-functions/prefer-arrow-functions': 'error',
    },
  },
  {
    files: ['**/*.d.ts'],
    name: 'ts-definition-files/prefer-arrow-off',
    rules: {
      'prefer-arrow-functions/prefer-arrow-functions': 'off',
    },
  },
];

/**
 * All `no-restricted-syntax` selectors live in one config object. ESLint flat
 * config merges this rule key by replacement (last match wins), not
 * concatenation, so a second block matching the same files would silently
 * clobber these selectors. Each selector carries its own message.
 *
 * `.d.ts` is ignored: ambient `export default function …(): T;` declarations
 * have no body to convert, and type-definition files contain no render code.
 */
const restrictedSyntaxConfig: Linter.Config[] = [
  {
    ignores: ['**/*.d.ts'],
    name: 'gaia/no-restricted-syntax',
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // `prefer-arrow-functions` has a hardcoded exemption for named
          // default-exported declarations
          // (`guard.js:hasNameAndIsExportedAsDefaultExport`), so
          // `export default function Foo() {}` slips through. This selector
          // closes that gap.
          message:
            'Use `const Name = () => {}; export default Name;` instead. The prefer-arrow-functions plugin exempts named default-exported declarations upstream.',
          selector: 'ExportDefaultDeclaration > FunctionDeclaration',
        },
        {
          // GAIA never renders `null`. `cond ? <JSX/> : null` is the
          // numeric-0-safe `&&` guard written the long way. Both JSX-null
          // ternary selectors only match a JSXElement/JSXFragment branch, so
          // they are inert outside `.tsx`/`.jsx`.
          message:
            'Do not render `null` from a ternary. Use a boolean-guarded `&&`: `cond && <JSX/>` (coerce a numeric/falsy guard with `!!cond`).',
          selector:
            "ConditionalExpression[alternate.raw='null']:matches([consequent.type='JSXElement'], [consequent.type='JSXFragment'])",
        },
        {
          message:
            'Do not render `null` from a ternary. Invert the condition and use `&&`: `!cond && <JSX/>`.',
          selector:
            "ConditionalExpression[consequent.raw='null']:matches([alternate.type='JSXElement'], [alternate.type='JSXFragment'])",
        },
        {
          // A `.length` left operand is always numeric, so `&&` returns the
          // literal `0` (a renderable value) when the list is empty, leaking
          // "0" into the DOM. `.length` is the single most common numeric-0
          // leak and flagging it has zero false positives; the general
          // `count && <JSX/>` case is still not caught (any expression could
          // be numeric). Report-only: a blind rewrite is unsafe in general.
          message:
            'A numeric `.length` left operand leaks "0" into the DOM when empty. Force a real boolean: `items.length > 0 && <JSX/>`.',
          selector:
            "LogicalExpression[operator='&&'][left.property.name='length']:matches([right.type='JSXElement'],[right.type='JSXFragment'])",
        },
      ],
    },
  },
];

/**
 * Global `no-restricted-imports` bans, applied to every `.ts`/`.tsx` file.
 *
 * The shared `RESTRICTED_IMPORT_PATHS` const is also spread into testing.ts's
 * own `no-restricted-imports` block. Flat config replaces a rule's options
 * wholesale, so without that second reference this global ban would be dropped
 * on test/story files (which testing.ts re-scopes the rule for).
 */
const restrictedImportsConfig: Linter.Config[] = [
  {
    files: ['**/*.ts?(x)'],
    name: 'gaia/no-restricted-imports',
    rules: {
      'no-restricted-imports': ['error', {paths: RESTRICTED_IMPORT_PATHS}],
    },
  },
];

const lodashUnderscoreConfig: Linter.Config[] = [
  {
    name: 'you-dont-need-lodash-underscore',
    plugins: {
      'you-dont-need-lodash-underscore':
        lodashUnderscore as unknown as ESLint.Plugin,
    },
    rules: {
      ...(lodashUnderscore.configs.compatible.rules as Linter.RulesRecord),
    },
  },
];

export const buildBase = (sourceDir: string): Linter.Config[] => [
  ...jsConfig,
  ...jsCustomConfig,
  ...typescriptConfig,
  ...buildTsEslintConfig(sourceDir),
  ...buildImportXConfig(sourceDir),
  ...unusedDisableDirectivesConfig,
  ...preferArrowFunctionsConfig,
  ...restrictedSyntaxConfig,
  ...restrictedImportsConfig,
  ...lodashUnderscoreConfig,
];
