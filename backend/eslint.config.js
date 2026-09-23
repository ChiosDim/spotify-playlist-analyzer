import js from "@eslint/js";
import n from "eslint-plugin-n";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  n.configs["flat/recommended"],
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["node_modules/", "coverage/"],
  },
];
