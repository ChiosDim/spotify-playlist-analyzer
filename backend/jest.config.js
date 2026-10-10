export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/index.js", "!src/instrument.mjs"],
  coverageDirectory: "coverage",
  setupFiles: ["<rootDir>/src/tests/setup.js"], // ← add this line
};
