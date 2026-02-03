import react from "@strv/eslint-config-react";
import optional from "@strv/eslint-config-react/optional";
import style from "@strv/eslint-config-react/style";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

const globs = {
  js: "**/*.{js,jsx}",
};

const withFiles = (config, files) =>
  (Array.isArray(config) ? config : [config]).map((entry) => ({
    files,
    ...entry,
  }));

export default [
  ...withFiles(react, [globs.js]),
  ...withFiles(optional, [globs.js]),
  ...withFiles(style, [globs.js]),
  {
    files: [globs.js],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parser: (await import("@babel/eslint-parser")).default,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        requireConfigFile: false,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx"],
        },
        alias: {
          map: [["@", "./src"]],
          extensions: [".js", ".jsx"],
        },
      },
    },
    rules: {
      "id-length": "off",
      "import/exports-last": "warn",
      "import/group-exports": "warn",
      "import/namespace": ["error", { allowComputed: true }],
      "import/no-cycle": ["error", { maxDepth: Infinity }],
      "import/no-default-export": "warn",
      "import/no-duplicates": "warn",
      "import/order": [
        "warn",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "never",
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
          pathGroups: [
            {
              pattern: "*.css",
              group: "index",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],
      "no-duplicate-imports": "error",
      "eqeqeq": ["error", "always"],
      "jsx-a11y/no-autofocus": ["warn", { ignoreNonDOM: true }],
      "jsx-quotes": "off",
      "linebreak-style": "off",
      "max-len": ["warn", { code: 140 }],
      "no-nested-ternary": "off",
      "no-shadow": "off",
      "no-unused-vars": ["warn", { ignoreRestSiblings: true }],
      "no-warning-comments": "off",
      "prefer-named-capture-group": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "off",
      "react/boolean-prop-naming": "off",
      "react/default-props-match-prop-types": "off",
      "react/display-name": "off",
      "react/jsx-child-element-spacing": "off",
      "react/jsx-filename-extension": "off",
      "react/jsx-handler-names": "off",
      "react/jsx-max-depth": "off",
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-no-bind": ["warn", { allowFunctions: true }],
      "react/jsx-wrap-multilines": [
        "warn",
        { condition: "parens", logical: "parens" },
      ],
      "react/no-unused-prop-types": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/require-default-props": "off",
      "react/sort-prop-types": "off",
      "semi": "off",
      "semi-style": "off",
      "react/no-this-in-sfc": "off",
      "simple-import-sort/imports": "off",
      "simple-import-sort/exports": "off",
      "space-infix-ops": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@stylistic/comma-dangle": "off",
      "@stylistic/function-paren-newline": "off",
      "@stylistic/linebreak-style": "off",
      "@stylistic/jsx-child-element-spacing": "warn",
      "@stylistic/padding-line-between-statements": "off",
      "@stylistic/quotes": "off",
      "@stylistic/semi": "off",
      "@stylistic/semi-style": "off",
    },
  },
  {
    files: [
      "scripts/**/*.js",
      "*.config.cjs",
      "commitlint.config.cjs",
      "babel.config.cjs",
      "postcss.config.cjs",
      "tailwind.config.cjs",
    ],
    languageOptions: {
      sourceType: "script",
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
