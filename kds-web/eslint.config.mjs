import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "react-refresh/only-export-components": "off",
      // Effect body setState patterns are valid for data-fetching on mount
      // and state-reset on modal close throughout this codebase.
      "react-hooks/set-state-in-effect": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "antd",
              message: "Ant Design is not part of the KDS frontend architecture.",
            },
          ],
          patterns: [
            {
              group: ["antd/*"],
              message: "Ant Design is not part of the KDS frontend architecture.",
            },
            {
              group: [
                "@/features/*/ui",
                "@/features/*/ui/*",
                "@/features/*/model",
                "@/features/*/model/*",
                "@/features/*/api",
                "@/features/*/api/*",
                "@/features/*/lib",
                "@/features/*/lib/*",
              ],
              message: "Import features through their public index, not internal segments.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value=/^@\\/features(?:\\/|$)/]",
          message: "Shared components cannot import feature code.",
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ImportDeclaration[source.value=/^@\\/(?:components\\/(?:blocks|layout)|pages|app)(?:\\/|$)/]",
          message: "UI primitives must stay independent of app, page, layout, and block layers.",
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/main.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value=/\\.css$/]",
          message: "Only src/main.tsx may import the global stylesheet.",
        },
      ],
    },
  },
])
