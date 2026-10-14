/**
 * Effect-misuse and React 19 rules in `react`: each one reports on a probe
 * through the real composed bundle, and a correct Effect with full cleanup
 * reports none of them.
 */
import {ESLint, type Linter} from 'eslint';
import tseslint from 'typescript-eslint';
import {describe, expect, test} from 'vitest';
import gaiaLint from '../index.js';

const lint = gaiaLint();

const eslint = new ESLint({
  overrideConfig: [
    ...lint.base,
    ...lint.react,
    ...lint.reactRouter,
    ...lint.guardrails,
    tseslint.configs.disableTypeChecked as Linter.Config,
    {languageOptions: {parserOptions: {project: null, projectService: false}}},
  ],
  overrideConfigFile: true,
});

const FILE = 'app/components/probe/index.tsx';

const ruleIdsFor = async (code: string, prefix: string): Promise<string[]> => {
  const [result] = await eslint.lintText(code, {filePath: FILE});
  return result.messages
    .map((message) => message.ruleId ?? '')
    .filter((ruleId) => ruleId.startsWith(prefix));
};

const YME = 'react-you-might-not-need-an-effect/';
const ER = '@eslint-react/';

describe('react-you-might-not-need-an-effect', () => {
  test('state derived in an Effect is reported', async () => {
    const code = [
      "import {useEffect, useState} from 'react';",
      '',
      'const Probe = ({first}: {first: string}) => {',
      "  const [full, setFull] = useState('');",
      '  useEffect(() => {',
      '    setFull(`${first}!`);',
      '  }, [first]);',
      '',
      '  return <p>{full}</p>;',
      '};',
      '',
      'export default Probe;',
      '',
    ].join('\n');
    expect(await ruleIdsFor(code, YME)).toContain(`${YME}no-derived-state`);
  });
});

describe('@eslint-react', () => {
  test('a listener added in an Effect without removal is reported', async () => {
    const code = [
      "import {useEffect} from 'react';",
      '',
      'const Probe = ({onResize}: {onResize: () => void}) => {',
      '  useEffect(() => {',
      "    window.addEventListener('resize', onResize);",
      '  }, [onResize]);',
      '',
      '  return <p />;',
      '};',
      '',
      'export default Probe;',
      '',
    ].join('\n');
    expect(await ruleIdsFor(code, ER)).toContain(
      `${ER}web-api-no-leaked-event-listener`,
    );
  });

  test('a timeout set in an Effect without clearing is reported', async () => {
    const code = [
      "import {useEffect} from 'react';",
      '',
      'const Probe = ({onTick}: {onTick: () => void}) => {',
      '  useEffect(() => {',
      '    setTimeout(onTick, 100);',
      '  }, [onTick]);',
      '',
      '  return <p />;',
      '};',
      '',
      'export default Probe;',
      '',
    ].join('\n');
    expect(await ruleIdsFor(code, ER)).toContain(
      `${ER}web-api-no-leaked-timeout`,
    );
  });

  test('forwardRef, useContext and Context.Provider are reported', async () => {
    const code = [
      "import {createContext, forwardRef, useContext} from 'react';",
      '',
      "const ThemeContext = createContext('light');",
      '',
      'export const Input = forwardRef<HTMLInputElement>((props, ref) => (',
      '  <input ref={ref} {...props} />',
      '));',
      '',
      'export const Themed = () => {',
      '  const theme = useContext(ThemeContext);',
      '',
      '  return (',
      '    <ThemeContext.Provider value={theme}>',
      '      <Input />',
      '    </ThemeContext.Provider>',
      '  );',
      '};',
      '',
    ].join('\n');
    const ids = await ruleIdsFor(code, ER);
    expect(ids).toContain(`${ER}no-forward-ref`);
    expect(ids).toContain(`${ER}no-use-context`);
    expect(ids).toContain(`${ER}no-context-provider`);
  });
});

test('an Effect that cleans up its listener and timeout reports none of them', async () => {
  const code = [
    "import {useEffect} from 'react';",
    '',
    'const Probe = ({onResize}: {onResize: () => void}) => {',
    '  useEffect(() => {',
    "    window.addEventListener('resize', onResize);",
    '    const timeout = setTimeout(onResize, 100);',
    '',
    '    return () => {',
    "      window.removeEventListener('resize', onResize);",
    '      clearTimeout(timeout);',
    '    };',
    '  }, [onResize]);',
    '',
    '  return <p />;',
    '};',
    '',
    'export default Probe;',
    '',
  ].join('\n');
  expect(await ruleIdsFor(code, YME)).toEqual([]);
  expect(await ruleIdsFor(code, ER)).toEqual([]);
});
