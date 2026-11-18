import type {Config} from 'prettier';
import {fileURLToPath} from 'node:url';

export type PrettierConfigOptions = {
  /** Sort Tailwind classes with prettier-plugin-tailwindcss. Defaults to true. */
  tailwind?: boolean;
};

const baseConfig: Config = {
  bracketSpacing: false,
  experimentalTernaries: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
};

// Everything the Tailwind plugin owns: the plugin and every `tailwind*` option
// it reads, so `tailwind: false` drops them together and Prettier never warns
// about an option no loaded plugin declares. The plugin is a path resolved from
// this package, not a bare name: Prettier resolves bare names from the
// consumer's working directory, where pnpm exposes only the consumer's own
// direct dependencies.
const tailwindConfig = (): Config => ({
  plugins: [fileURLToPath(import.meta.resolve('prettier-plugin-tailwindcss'))],
  tailwindFunctions: ['cn', 'twJoin', 'twMerge'],
});

export const prettierConfig = ({
  tailwind = true,
}: PrettierConfigOptions = {}): Config =>
  tailwind ? {...baseConfig, ...tailwindConfig()} : {...baseConfig};

const config: Config = prettierConfig();

export default config;
