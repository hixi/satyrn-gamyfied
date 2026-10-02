import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globalSetup: './tests/global-setup.ts',
    include: ['tests/**/*.test.ts'],
  },
});