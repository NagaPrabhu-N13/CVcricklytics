/* eslint-env node */
module.exports = {
  env: {
    node: true,
    commonjs: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 12,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    "no-unused-vars": "warn", // Warn but don't fail
    "no-undef": "error",      // Re-enable for better code quality
    quotes: ["error", "double", { allowTemplateLiterals: true }], // If you insist on double quotes
    "prefer-arrow-callback": "error",
    "max-len": ["error", { code: 120 }], // Google default is 80; adjust if needed
  },
};