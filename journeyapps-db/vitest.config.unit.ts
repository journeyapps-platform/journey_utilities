import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['./**/*.test.ts'],
    reporters: 'verbose',
    environment: 'jsdom',
    setupFiles: ['./tests/setup/databaseSetup.ts']
  }
});
