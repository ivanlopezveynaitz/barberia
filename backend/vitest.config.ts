import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    maxConcurrency: 1, // Ejecutar tests secuencialmente para evitar conflictos de DB
  },
});
