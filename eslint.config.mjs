import js from "@eslint/js";

export default [
  {
    ignores: ["src/main.tsx"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-empty": "warn",
      "no-undef": "off",
    },
  },
];
