import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    reporters: 'verbose',
    alias: {
      stream: 'stream-browserify'
    },
    browser: {
      name: 'chrome',
      enabled: true
    }
  }
});
