import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Served behind the gateway on :8080, so HMR must connect there.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, strictPort: true, hmr: { clientPort: 8080 } },
});
