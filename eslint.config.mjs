import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
//import _import from "eslint-plugin-import";
import noOnlyTests from "eslint-plugin-no-only-tests";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "**/vscode.proposed.inlineCompletions.d.ts",
        "**/node_modules",
        "**/dist",
        "**/out",
        "**/coverage",
        "**/.eslintrc.js",
    ],
}, ...fixupConfigRules(compat.extends(
    "airbnb-typescript/base",
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/errors",
    "plugin:import/typescript",
    "prettier",
)), {
    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        import: fixupPluginRules(_import),
        "no-only-tests": noOnlyTests,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "commonjs",

        parserOptions: {
            project: "./tsconfig.json",
            tsconfigRootDir: "W:\\ws_tds_vscode\\tds-gaia",
        },
    },

    settings: {
        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
            },
        },
    },

    rules: {
        "no-void": "off",
        "no-console": "off",

        "import/no-extraneous-dependencies": ["error", {
            devDependencies: ["src/test/**/*.ts"],
        }],

        "@typescript-eslint/restrict-template-expressions": ["error", {
            allowAny: true,
            allowNumber: true,
            allowBoolean: true,
            allowNullish: false,
        }],

        "@typescript-eslint/no-use-before-define": ["error", {
            functions: false,
            classes: false,
        }],

        "no-use-before-define": ["error", {
            functions: false,
            classes: false,
        }],

        "import/no-unresolved": "error",

        "import/extensions": ["error", "ignorePackages", {
            js: "never",
            ts: "never",
        }],
    },
}];