module.exports = {
  root: true,
  env: {
    node: true,
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2020,
    project: './tsconfig.json',
    extraFileExtensions: ['.vue'],
  },
  plugins: [
    '@vue',
    'babel',
    '@typescript-eslint',
  ],
  extends: [
    'plugin:vue/recommended',
    '@vue/typescript',
    '@vue/airbnb',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-expressions': 'off',
    'babel/no-unused-expressions': 'error',
    semi: 'off',
    quotes: [1, 'double'],
    '@typescript-eslint/semi': 'error',
    '@typescript-eslint/type-annotation-spacing': 'error',
    'class-methods-use-this': 'off',
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "error"
    ],
  },
};
