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

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
//import { keycloakify } from "keycloakify/vite-plugin"

export default defineConfig(({mode}) => {
  // const isKeycloakBuild =
  //   process.env.KEYCLOAKIFY === "true" || process.env.KEYCLOAKIFY === "1";

  const env = loadEnv(mode, process.cwd(), "");

  const backendTarget = `http://${env.VITE_BASE_IP}:8084`;

  return {
    logLevel: "info" as const,
    plugins: [
      react(),
      tailwindcss(),
      // keycloakify({
      //   themeName: "bms-theme",
      //   accountThemeImplementation: "Multi-Page",
      // })
    ],
      resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: backendTarget,
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
