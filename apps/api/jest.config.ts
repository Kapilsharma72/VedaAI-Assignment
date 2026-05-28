import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.property.test.ts'],
  setupFiles: ['<rootDir>/src/__tests__/jest.setup.ts'],
  moduleNameMapper: {
    '^@vedaai/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@vedaai/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
};

export default config;
