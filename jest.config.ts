import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/js-with-babel",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!@clerk|html-to-text|cheerio)/"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },
  moduleDirectories: ["node_modules", "src"], // optional but helps resolve paths

  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/components/ui/",
    "/src/hooks/",
    "/src/trpc/",
    "/src/env.js",
    "/src/app/_components/",
    "/src/app/mail/atoms.ts",
  ],
};

export default config;
