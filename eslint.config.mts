import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["node_modules", "dist"],
    rules: {
      "no-unused-vars": "error",
      "no-unused-expressions": "error",
      "prefer-const": "error",
      "no-console": "warn",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    rules: {
      "prettier/prettier": "error", // Show Prettier issues as ESLint errors
    },
    extends: ["js/recommended", "plugin:prettier/recommended"],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
]);
