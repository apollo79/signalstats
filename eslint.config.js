// @ts-check

import eslint from "@eslint/js";
import tsparser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import solid from "eslint-plugin-solid/configs/typescript";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**/*.ts", "dist/**", "**/*.mjs", "eslint.config.js", "**/*.js"],
  },
  [
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    eslintPluginPrettierRecommended,
    eslintConfigPrettier,
    {
      ...solid,
      languageOptions: {
        parser: tsparser,
        // Specifies the ESLint parser
        parserOptions: {
          ecmaVersion: 2024,
          // Allows for the parsing of modern ECMAScript features
          sourceType: "module",
          // Allows for the use of imports
          ecmaFeatures: {
            jsx: true, // Allows for the parsing of JSX
          },
          project: "./tsconfig.json",
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },

      plugins: {
        "simple-import-sort": simpleImportSort,
      },
      rules: {
        // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
        // e.g. "@typescript-eslint/explicit-function-return-type": "off",
        "simple-import-sort/imports": [
          "error",
          {
            groups: [
              // solidjs
              ["^solid-(js|start)", "^@solidjs/"],
              ["^@?\\w"],
              // components imports
              ["^~/components/?"],
              // other /src imports
              ["^~/"],
              // Parent imports. Put `..` last.
              ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
              // Other relative imports. Put same-folder imports and `.` last.
              ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
              // types imports
              ["^~/types$"],
              // Side effect imports.
              ["^\\u0000"],
              // Style imports.
              ["^.+\\.?(s?css)$"],
            ],
          },
        ],
        "simple-import-sort/exports": "error",
        //   "@typescript-eslint/consistent-type-imports": "error",
        //   "@typescript-eslint/consistent-type-exports": "error",
      },
    },
  ],
);
