import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['shared/**/*.test.ts', 'backend/src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['shared/evaluator.ts'],
      exclude: ['backend/**'],
      thresholds: {
        branches: 100,
      },
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});
