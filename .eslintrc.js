module.exports = {
  root: true,
  env: {
    node: true,
  },
  plugins: [
    'vue',
    "babel"
  ],
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-expressions': 'off',
    'babel/no-unused-expressions': 'error',
    'semi': 'off',
    '@typescript-eslint/semi': 'error',
  },
};
