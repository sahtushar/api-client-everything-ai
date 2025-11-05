module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: "./eslint/tsconfig.json",
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  plugins: ["@typescript-eslint", "jest", "unused-imports"],
  settings: {
    propWrapperFunctions: [
      "forbidExtraProps",
      {property: "freeze", object: "Object"},
      {property: "myFavoriteWrapper"},
    ],
    linkComponents: ["Hyperlink", {name: "Link", linkAttribute: "to"}],
  },
  rules: {
    "no-undef": 0,
    "no-use-before-define": 0,
    "@typescript-eslint/no-use-before-define": 0,
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "import/no-anonymous-default-export": 0,
    eqeqeq: 0,
    "@typescript-eslint/strict-boolean-expressions": 1,
    curly: ["error", "all"],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        vars: "all", // Check all variables
        args: "after-used", // Ignore unused function arguments if they come after used ones
        ignoreRestSiblings: true, // Ignore unused variables in rest destructuring
        varsIgnorePattern: "^_", // Ignore variables starting with `_`
        argsIgnorePattern: "^_", // Ignore arguments starting with `_`
      },
    ],
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
  },
  overrides: [
    {
      files: ["**/*.ts"],
    },
  ],
  ignorePatterns: ["scripts/*"],
};
