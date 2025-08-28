import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

// Type assertion to handle optional paths property
const typedCompilerOptions = compilerOptions as typeof compilerOptions & {
  paths?: Record<string, string[]>;
};

const config: Config = {
  rootDir: '.',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
        diagnostics: {
          ignoreCodes: [1343],
        },
      },
    ],
  },
  moduleNameMapper: {
    ...(typedCompilerOptions.paths
      ? pathsToModuleNameMapper(typedCompilerOptions.paths, { prefix: '<rootDir>' })
      : {}),
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  testTimeout: 40000,
};

export default config;
