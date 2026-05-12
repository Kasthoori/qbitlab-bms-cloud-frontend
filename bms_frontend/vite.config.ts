import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const backendIp = env.VITE_BASE_IP || "localhost";
  const backendTarget = `http://${backendIp}:8084`;

  console.log("[VITE] Backend proxy target:", backendTarget);
  console.log("[VITE] Keycloak URL:", env.VITE_KEYCLOAK_URL);

  return {
    logLevel: "info" as const,

    plugins: [
      react(),
      basicSsl(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },

    server: {
      host: "0.0.0.0",
      port: 5173,

      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },

        "/ws": {
          target: backendTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    define: {
      global: "window",
    },

    build: {
      sourcemap: true,
    },

    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setupTests.ts",
      css: true,
      silent: false,
    },
  };
});