import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['./**/ExpressionParser.test.ts'],
    reporters: 'verbose'
  }
});
