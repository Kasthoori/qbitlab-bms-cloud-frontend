import { defineConfig as testConfig, mergeConfig } from 'vitest/config';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const viteConfig = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8084",
        changeOrigin: true,
      }
    }
  },
  define: {
    global: "window"
  },
  build: {
    sourcemap: true
  }
 
});

const vitestConfig = testConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setupTests.ts',
    css: true,
    silent: false,
  }
});

export default mergeConfig(viteConfig, vitestConfig);
