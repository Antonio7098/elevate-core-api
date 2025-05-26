// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/src'], // Look for tests in test and src directories
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    // Example: '^@/(.*)$': '<rootDir>/src/$1'
  },
  // Setup files after env is setup (e.g., for global mocks or test db setup)
  // setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  // Collect coverage from src directory, excluding specific files/folders
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts', // Exclude type definition files
    '!src/app.ts', // Usually, the main app entry point is hard to unit test directly
    '!src/db/prisma/migrations/**', // Exclude migrations
    // Add other exclusions as needed
  ],
  coverageDirectory: 'coverage',
  reporters: ['default'], // Add JUnit reporter for CI/CD integration if needed
};
