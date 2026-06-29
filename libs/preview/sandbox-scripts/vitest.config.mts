import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/preview/sandbox-scripts',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'sandbox-scripts',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/preview/sandbox-scripts',
      provider: 'v8' as const,
    },
  },
}));
