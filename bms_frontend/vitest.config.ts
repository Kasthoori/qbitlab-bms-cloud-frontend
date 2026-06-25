/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));
const storybookConfigDir = fileURLToPath(new URL("./.storybook", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    storybookTest({
      configDir: storybookConfigDir,
    }),
  ],

  resolve: {
    alias: {
      "@": srcPath,
    },
  },

  define: {
    global: "window",
  },

  test: {
    name: "storybook",

    browser: {
      enabled: true,
      provider: playwright({}),
      instances: [{ browser: "chromium" }],
    },

    setupFiles: [".storybook/vitest.setup.ts"],

    css: true,
    globals: true,
  },
});