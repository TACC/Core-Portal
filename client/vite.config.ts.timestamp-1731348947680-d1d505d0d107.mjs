// ../../../vite.config.ts
import eslint from "file:///Users/jl88238/Documents/Code/TACC-Core-Portal/Core-Portal/client/node_modules/@rollup/plugin-eslint/dist/index.js";
import { defineConfig } from "file:///Users/jl88238/Documents/Code/TACC-Core-Portal/Core-Portal/client/node_modules/vite/dist/node/index.js";
import react from "file:///Users/jl88238/Documents/Code/TACC-Core-Portal/Core-Portal/client/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/Users/jl88238/Documents/Code/TACC-Core-Portal/Core-Portal/client";
var vite_config_default = defineConfig({
  base: "/core/static/",
  css: { preprocessorOptions: { scss: { charset: false, api: "modern" } } },
  plugins: [
    {
      ...eslint({ include: "src/**/*.+(js|jsx|ts|tsx)", fix: false }),
      enforce: "pre"
    },
    react()
  ],
  resolve: {
    alias: {
      _common: resolve(__vite_injected_original_dirname, "src/components/_common"),
      hooks: resolve(__vite_injected_original_dirname, "src/hooks"),
      utils: resolve(__vite_injected_original_dirname, "src/utils"),
      styles: resolve(__vite_injected_original_dirname, "src/styles")
    }
  },
  server: {
    origin: "cep.test",
    port: 3e3,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 3e3
    }
  },
  test: {
    globals: true,
    environment: "jsdom"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vdml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvamw4ODIzOC9Eb2N1bWVudHMvQ29kZS9UQUNDLUNvcmUtUG9ydGFsL0NvcmUtUG9ydGFsL2NsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2psODgyMzgvRG9jdW1lbnRzL0NvZGUvVEFDQy1Db3JlLVBvcnRhbC9Db3JlLVBvcnRhbC9jbGllbnQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2psODgyMzgvRG9jdW1lbnRzL0NvZGUvVEFDQy1Db3JlLVBvcnRhbC9Db3JlLVBvcnRhbC9jbGllbnQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgZXNsaW50IGZyb20gJ0Byb2xsdXAvcGx1Z2luLWVzbGludCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYmFzZTogJy9jb3JlL3N0YXRpYy8nLFxuICBjc3M6IHsgcHJlcHJvY2Vzc29yT3B0aW9uczogeyBzY3NzOiB7IGNoYXJzZXQ6IGZhbHNlLCBhcGk6ICdtb2Rlcm4nIH0gfSB9LFxuICBwbHVnaW5zOiBbXG4gICAge1xuICAgICAgLi4uZXNsaW50KHsgaW5jbHVkZTogJ3NyYy8qKi8qLisoanN8anN4fHRzfHRzeCknLCBmaXg6IGZhbHNlIH0pLFxuICAgICAgZW5mb3JjZTogJ3ByZScsXG4gICAgfSxcbiAgICByZWFjdCgpLFxuICBdLFxuXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgX2NvbW1vbjogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvY29tcG9uZW50cy9fY29tbW9uJyksXG4gICAgICBob29rczogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaG9va3MnKSxcbiAgICAgIHV0aWxzOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy91dGlscycpLFxuICAgICAgc3R5bGVzOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9zdHlsZXMnKSxcbiAgICB9LFxuICB9LFxuXG4gIHNlcnZlcjoge1xuICAgIG9yaWdpbjogJ2NlcC50ZXN0JyxcbiAgICBwb3J0OiAzMDAwLFxuICAgIGhtcjoge1xuICAgICAgcHJvdG9jb2w6ICd3cycsXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgIHBvcnQ6IDMwMDAsXG4gICAgfSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVgsT0FBTyxZQUFZO0FBQ3hZLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFIeEIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLEVBQ04sS0FBSyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sRUFBRSxTQUFTLE9BQU8sS0FBSyxTQUFTLEVBQUUsRUFBRTtBQUFBLEVBQ3hFLFNBQVM7QUFBQSxJQUNQO0FBQUEsTUFDRSxHQUFHLE9BQU8sRUFBRSxTQUFTLDZCQUE2QixLQUFLLE1BQU0sQ0FBQztBQUFBLE1BQzlELFNBQVM7QUFBQSxJQUNYO0FBQUEsSUFDQSxNQUFNO0FBQUEsRUFDUjtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsU0FBUyxRQUFRLGtDQUFXLHdCQUF3QjtBQUFBLE1BQ3BELE9BQU8sUUFBUSxrQ0FBVyxXQUFXO0FBQUEsTUFDckMsT0FBTyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxNQUNyQyxRQUFRLFFBQVEsa0NBQVcsWUFBWTtBQUFBLElBQ3pDO0FBQUEsRUFDRjtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ04sUUFBUTtBQUFBLElBQ1IsTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsRUFDZjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
