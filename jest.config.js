module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  moduleDirectories: ["node_modules", "<rootDir>/server-bridge/node_modules"],
  collectCoverageFrom: [
    "server-bridge/**/*.js",
    "p5-sketch/**/*.js",
    "!**/node_modules/**"
  ],
  coverageDirectory: "coverage",
  verbose: true
};
