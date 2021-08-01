module.exports = {
    env: {
        browser: true,
        es6: true,
        node: false,
    },
    extends: ['plugin:vue/essential', 'plugin:prettier/recommended'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    plugins: ['vue'],
    rules: {},
};
