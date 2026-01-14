import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run unit tests under `tests/` and avoid Playwright e2e specs
    include: ['tests/**/*.test.ts'],
    exclude: ['**/e2e/**'],
    environment: 'node',
    globals: true,
  },
});
