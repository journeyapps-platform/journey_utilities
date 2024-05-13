import { defineConfig } from 'vitest/config';

export default defineConfig({
  optimizeDeps: {
    include: ['@journeyapps/core-xml']
  },
  build: {
    commonjsOptions: {
      include: [/@journeyapps\/core-xml/]
    }
  },
  test: {
    alias: {
      stream: 'stream-browserify'
    },
    globals: true,
    reporters: 'verbose',
    browser: {
      name: 'chrome',
      enabled: true,
      headless: true
    }
  }
});
