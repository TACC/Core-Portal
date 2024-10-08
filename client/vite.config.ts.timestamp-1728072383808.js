// vite.config.ts
import eslint from "@rollup/plugin-eslint";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
var vite_config_default = defineConfig({
  base: "/core/static/",
  css: { preprocessorOptions: { scss: { charset: false } } },
  plugins: [
    {
      ...eslint({ include: "src/**/*.+(js|jsx|ts|tsx)", fix: false }),
      enforce: "pre"
    },
    react()
  ],
  resolve: {
    alias: {
      _common: resolve("/Users/jm63959/Development/Core-Portal/client", "src/components/_common"),
      hooks: resolve("/Users/jm63959/Development/Core-Portal/client", "src/hooks"),
      utils: resolve("/Users/jm63959/Development/Core-Portal/client", "src/utils"),
      styles: resolve("/Users/jm63959/Development/Core-Portal/client", "src/styles")
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCBlc2xpbnQgZnJvbSAnQHJvbGx1cC9wbHVnaW4tZXNsaW50JztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOiAnL2NvcmUvc3RhdGljLycsXG4gIGNzczogeyBwcmVwcm9jZXNzb3JPcHRpb25zOiB7IHNjc3M6IHsgY2hhcnNldDogZmFsc2UgfSB9IH0sXG4gIHBsdWdpbnM6IFtcbiAgICB7XG4gICAgICAuLi5lc2xpbnQoeyBpbmNsdWRlOiAnc3JjLyoqLyouKyhqc3xqc3h8dHN8dHN4KScsIGZpeDogZmFsc2UgfSksXG4gICAgICBlbmZvcmNlOiAncHJlJyxcbiAgICB9LFxuICAgIHJlYWN0KCksXG4gIF0sXG5cbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBfY29tbW9uOiByZXNvbHZlKFwiL1VzZXJzL2ptNjM5NTkvRGV2ZWxvcG1lbnQvQ29yZS1Qb3J0YWwvY2xpZW50XCIsICdzcmMvY29tcG9uZW50cy9fY29tbW9uJyksXG4gICAgICBob29rczogcmVzb2x2ZShcIi9Vc2Vycy9qbTYzOTU5L0RldmVsb3BtZW50L0NvcmUtUG9ydGFsL2NsaWVudFwiLCAnc3JjL2hvb2tzJyksXG4gICAgICB1dGlsczogcmVzb2x2ZShcIi9Vc2Vycy9qbTYzOTU5L0RldmVsb3BtZW50L0NvcmUtUG9ydGFsL2NsaWVudFwiLCAnc3JjL3V0aWxzJyksXG4gICAgICBzdHlsZXM6IHJlc29sdmUoXCIvVXNlcnMvam02Mzk1OS9EZXZlbG9wbWVudC9Db3JlLVBvcnRhbC9jbGllbnRcIiwgJ3NyYy9zdHlsZXMnKSxcbiAgICB9LFxuICB9LFxuXG4gIHNlcnZlcjoge1xuICAgIG9yaWdpbjogJ2NlcC50ZXN0JyxcbiAgICBwb3J0OiAzMDAwLFxuICAgIGhtcjoge1xuICAgICAgcHJvdG9jb2w6ICd3cycsXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgIHBvcnQ6IDMwMDAsXG4gICAgfSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUlBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxNQUFNLEVBQUUsU0FBUyxNQUFNLEVBQUUsRUFBRTtBQUFBLEVBQ3pELFNBQVM7QUFBQSxJQUNQO0FBQUEsU0FDSyxPQUFPLEVBQUUsU0FBUyw2QkFBNkIsS0FBSyxNQUFNLENBQUM7QUFBQSxNQUM5RCxTQUFTO0FBQUEsSUFDWDtBQUFBLElBQ0EsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLFNBQVMsUUFBUSxpREFBaUQsd0JBQXdCO0FBQUEsTUFDMUYsT0FBTyxRQUFRLGlEQUFpRCxXQUFXO0FBQUEsTUFDM0UsT0FBTyxRQUFRLGlEQUFpRCxXQUFXO0FBQUEsTUFDM0UsUUFBUSxRQUFRLGlEQUFpRCxZQUFZO0FBQUEsSUFDL0U7QUFBQSxFQUNGO0FBQUEsRUFFQSxRQUFRO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxVQUFVO0FBQUEsTUFDVixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxFQUNmO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
