const { globalIgnores } = require('eslint/config')
const eslint = require('@eslint/js')
const eslintConfigPrettier = require('eslint-config-prettier')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const eslintPluginVue = require('eslint-plugin-vue')
const globals = require('globals')
const typescriptEslint = require('typescript-eslint')
const eslintrcImport = require('./.eslintrc-auto-import.json')


module.exports = typescriptEslint.config(
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...eslintrcImport.globals },
      ecmaVersion: 'latest',
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },

    extends: [
      eslint.configs.recommended,
      ...typescriptEslint.configs.recommended,
      ...eslintPluginVue.configs['flat/recommended'],
    ],
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-required-prop-with-default': 'off',
      'vue/no-v-html': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',

      'prettier/prettier': [
        'warn',
        {
          singleQuote: true,
          semi: false,
          trailingComma: 'es5',
          printWidth: 100,
          tabWidth: 2,
          endOfLine: 'auto',
        },
      ],
    },
  },
  globalIgnores([
    'node_modules/',
    'dist/',
    'public/',
    'eslint.config.cjs',
    '**/*.md',
    '**/*.woff',
    '**/*.ttf',
    '**/.vscode/',
    '**/.DS_Store',
  ]),
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
)
