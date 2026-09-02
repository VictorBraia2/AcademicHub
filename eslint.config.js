import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".tsbuild-node"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["error"] }],
    },
  },
  {
    // logger.ts é o único lugar que tem permissão de chamar console.* — é
    // literalmente o trabalho dele. Em qualquer outro arquivo, a regra
    // acima continua valendo (só console.error é permitido direto).
    files: ["src/shared/utils/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Funções serverless lidam com JSON não tipado vindo de APIs externas
    // (OpenAlex, Crossref, Semantic Scholar, Google Books, Unpaywall,
    // Anthropic) — 'any' ali é uma escolha deliberada, não descuido.
    files: ["api/**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  prettierConfig
);
