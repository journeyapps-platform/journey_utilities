import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['./tests/**/*.test.ts'],
    reporters: 'verbose',
    alias: {
      stream: 'stream-browserify'
    },
    browser: {
      name: 'chrome',
      enabled: true,
      headless: true
    }
  }
});
