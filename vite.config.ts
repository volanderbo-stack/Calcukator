import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Відносні шляхи, щоб збірку можна було розмістити в будь-якій теці.
  base: './',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
