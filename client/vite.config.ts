import eslint from '@rollup/plugin-eslint';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/core/static/',
  css: { preprocessorOptions: { scss: { charset: false } } },
  plugins: [
    {
      ...eslint({ include: 'src/**/*.+(js|jsx|ts|tsx)', fix: false }),
      enforce: 'pre',
    },
    react(),
  ],

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
    origin: 'cep.test',
    port: 3000,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
