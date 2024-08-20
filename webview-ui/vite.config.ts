import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: "./src/test/index.html"
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        main: new URL('./src/test/index.html', import.meta.url).pathname,
      },
    },
  },
}) satisfies UserConfig;
