import pluginVue from 'eslint-plugin-vue';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import oxlint from 'eslint-plugin-oxlint';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  {
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
  },

  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig({
    extends: ['recommendedTypeChecked', 'stylisticTypeChecked', 'strictTypeChecked'],
  }),
  oxlint.configs['flat/recommended'],
  skipFormatting,

  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
