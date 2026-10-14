declare module 'eslint-plugin-you-dont-need-lodash-underscore' {
  type LooseRules = Record<string, unknown>;
  const plugin: {
    configs: {
      all: {rules: LooseRules};
      compatible: {rules: LooseRules};
    };
    rules: LooseRules;
  };
  export default plugin;
}

declare module '@eslint-community/eslint-plugin-eslint-comments/configs' {
  import type {Linter} from 'eslint';

  const configs: {
    recommended: Linter.Config & {rules: Linter.RulesRecord};
  };
  export default configs;
}

declare module 'eslint-plugin-i18next' {
  import type {ESLint} from 'eslint';

  const plugin: ESLint.Plugin;
  export default plugin;
}
