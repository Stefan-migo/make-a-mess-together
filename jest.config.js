module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: [
    "server-bridge/**/*.js",
    "p5-sketch/**/*.js",
    "!**/node_modules/**"
  ],
  coverageDirectory: "coverage",
  verbose: true
};
