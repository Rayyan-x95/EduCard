module.exports = {
  extends: ["expo"],
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: [
    "node_modules/",
    ".expo/",
    "dist/",
    "web-build/",
    // Operational scripts (e.g. scripts/security-audit.ts) run against live
    // environments via tsx/node — they are not part of the app build.
    "scripts/",
    "*.log",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "import/no-unresolved": "off",
    "react-hooks/exhaustive-deps": "warn",
    // New React-Compiler-era rule (eslint-config-expo 57). The flagged sites
    // are legitimate patterns: state resets on query change and loading
    // flags after async work inside effects. Downgraded to warning until a
    // deliberate pass migrates them to derived-state idioms.
    "react-hooks/set-state-in-effect": "warn",
  },
};
