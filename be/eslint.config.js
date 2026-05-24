import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import node from "eslint-plugin-n";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**"]),
  js.configs.recommended,
  node.configs["flat/recommended-module"],
  {
    files: ["eslint.config.js"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "n/no-unpublished-import": "off",
    },
  },
  {
    files: ["src/**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    rules: {
      "n/no-missing-import": "off",
      "n/no-unsupported-features/es-syntax": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
