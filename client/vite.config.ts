import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/core/static/',

  css: {
    preprocessorOptions: {
      scss: {
        charset: false,
        api: 'modern',
      },
    },
  },

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      _common: resolve(__dirname, 'src/components/_common'),
      _custom: resolve(__dirname, 'src/components/_custom'),
      hooks: resolve(__dirname, 'src/hooks'),
      utils: resolve(__dirname, 'src/utils'),
      styles: resolve(__dirname, 'src/styles'),
    },
  },

  server: {
    origin: 'https://cep.test',
    port: 3000,
    cors: {
      origin: ['https://cep.test'],
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
