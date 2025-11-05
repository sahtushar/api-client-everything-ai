module.exports = {
  bracketSpacing: false,
  bracketSameLine: true,
  trailingComma: "es5",
  printWidth: 80,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: [
    "^react$", // React first
    "^react/.+$", // React submodules
    "<THIRD_PARTY_MODULES>", // Other libraries
    "^@zeniai/.+$", // Any Zeni AI libraries (e.g., @zeniai/client-epic-state)
    "^@/(.*)$", // Absolute imports (e.g., @/components)
    "^[./](?!.*(mock|svg)).*$", // Local imports, excluding mocks and SVGs
    ".*mock.*$", // Mock files
    ".*\\.svg$", // SVG imports
    ".*\\.svg(\\?.*)?$", // SVG imports (including "?react" suffix) at the very bottom
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
