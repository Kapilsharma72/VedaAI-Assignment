import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.property.test.ts',
    '**/*.property.test.tsx',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@vedaai/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@vedaai/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg|ico|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          moduleResolution: 'node',
          module: 'commonjs',
          paths: {
            '@/*': ['./src/*'],
            '@vedaai/shared': ['../../packages/shared/src/index.ts'],
          },
        },
      },
    ],
  },
};

export default config;
