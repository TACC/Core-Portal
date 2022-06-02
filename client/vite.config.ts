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
    {...eslint({include: 'src/**/*.+(js|jsx|ts|tsx)', fix: false}), enforce: 'pre', },
    react(),
  ],

  resolve: {
    alias: {
      _common: resolve(__dirname, 'src/components/_common'),
      hooks: resolve(__dirname, 'src/hooks'),
      utils: resolve(__dirname, 'src/utils'),
      styles: resolve(__dirname, 'src/styles'),
    },
  },

  server: {
    host: "cep.dev",
    https: {
      key: fs.readFileSync('../server/conf/nginx/certificates/cep.dev.key'),
      cert: fs.readFileSync('../server/conf/nginx/certificates/cep.dev.crt')
    },
    hmr: {
      port: 3000,
    },
  },
});
