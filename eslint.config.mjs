import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Next 15 uses this flat config (superseding the legacy .eslintrc.json). The build gate is
    // ON; these inherited-codebase stylistic rules are downgraded to warnings so they're visible
    // without blocking the build, while real correctness rules still fail it. Tighten over time.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
