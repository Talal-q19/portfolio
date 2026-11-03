import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['convex-tests/**/*.test.mjs'], environment: 'node' } });
