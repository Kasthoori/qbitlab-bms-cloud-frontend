// import { defineConfig as testConfig, mergeConfig } from "vitest/config";
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
// import { keycloakify } from "keycloakify/vite-plugin"

// const isKeycloakBuild = process.env.KEYCLOAKIFY === "true";

// const viteConfig = defineConfig({
//   logLevel: "info",
//   plugins: [
//     react(),
//     tailwindcss(),
//     ...(isKeycloakBuild
//       ? [
//           keycloakify({
//             themeName: "bms-theme",
//             accountThemeImplementation: "Multi-Page",
//           }),
//         ]
//       : []),
//   ],
//   server: {
//     proxy: {
//       "/api": {
//         target: "http://localhost:8084",
//         changeOrigin: true,
//       },
//     },
//   },
//   define: { global: "window" },
//   build: { sourcemap: true },
// });

// const vitestConfig = testConfig({
//   test: {
//     environment: "jsdom",
//     globals: true,
//     setupFiles: "./src/test/setupTests.ts",
//     css: true,
//     silent: false,
//   },
// });

// export default mergeConfig(viteConfig, vitestConfig);

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => {
  // const isKeycloakBuild =
  //   process.env.KEYCLOAKIFY === "true" || process.env.KEYCLOAKIFY === "1";

  return {
    logLevel: "info" as const,
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8084",
          changeOrigin: true,
        },
      },
    },
    define: { global: "window" },
    build: { sourcemap: true },

    // ✅ Vitest config lives here (Vitest reads it from Vite config)
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setupTests.ts",
      css: true,
      silent: false,
    },
  };
});
