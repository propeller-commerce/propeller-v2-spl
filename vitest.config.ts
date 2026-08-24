import { defineConfig } from 'vitest/config';

/**
 * jsdom so the one `<SparePartsLive>` mount test can render; the pure-logic
 * tests (tree/hotspots/buildCards/products) run fine under it too.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
