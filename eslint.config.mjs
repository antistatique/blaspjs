import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['./*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      js,
      '@typescript-eslint': typescript,
      prettier: prettier,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      'arrow-body-style': ['error', 'as-needed'],
      'prettier/prettier': [
        'error',
        {
          arrowParens: 'avoid',
          singleQuote: true,
          trailingComma: 'es5',
          printWidth: 130,
          'importOrder': [
            '^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)',
            '^react$',
            '<THIRD_PARTY_MODULES>',
            '^@(.*)$',
            '^[./](?!.*\\.css$)',
            '(.css)$',
          ],
          'importOrderSeparation': true,
          'importOrderSortSpecifiers': true,
          plugins: [
            '@trivago/prettier-plugin-sort-imports',
          ],
        },
      ],
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  prettierConfig,
];