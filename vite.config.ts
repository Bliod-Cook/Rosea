import { defineConfig } from 'vite';
import { resolve } from 'path'
import * as path from "node:path";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy"

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // prevent vite from obscuring rust errors
  clearScreen: false,
  server: {
    // Tauri expects a fixed port, fail if that port is not available
    strictPort: true,
    // if the host Tauri is expecting is set, use it
    host: host || false,
    port: 5173,
  },
  // Env variables starting with the item of `envPrefix` will be exposed in tauri's source code through `import.meta.env`.
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target:
        process.env.TAURI_ENV_PLATFORM == 'windows'
            ? 'chrome105'
            : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    outDir: "../dist/",
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        update: resolve(__dirname, 'src/update/index.html'),
        menu: resolve(__dirname, 'src/menu/index.html'),
        canvas: resolve(__dirname, 'src/canvas/index.html')
      },
    },
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
  root: "src",
  define: {
    global: {},
  },
  plugins: [
      react(),
      legacy({
        renderLegacyChunks: false,
        modernTargets: ["edge>=109", "safari>=13"],
        modernPolyfills: true,
      }),
  ]
});