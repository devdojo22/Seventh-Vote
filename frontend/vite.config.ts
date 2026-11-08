import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const publicHost = process.env.PUBLIC_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {host: true, port: 5173, strictPort: true, allowedHosts: publicHost ? [publicHost] : [], hmr: publicHost ? { protocol: 'wss', clientPort: 443 } : { clientPort: 8080 },
  },
});
