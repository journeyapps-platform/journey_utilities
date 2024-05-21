import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    'process.env': process.env
  },
  test: {
    globals: true,
    reporters: 'verbose',
    browser: {
      name: 'chrome',
      enabled: true,
      headless: true
    }
  }
});
