import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(appDir, '../..')

export default defineConfig({
  resolve: {
    alias: {
      '@repo/api': path.resolve(rootDir, 'packages/api/src/index.ts'),
      '@repo/auth': path.resolve(rootDir, 'packages/auth/src/index.ts'),
    },
  },
  plugins: [
    react(),
    {
      name: 'mock-users-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/users' && req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'User berhasil ditambahkan (Mock)', id: 'mock-' + Date.now() }));
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    fs: {
      allow: [rootDir],
    },
    proxy: {
      '/api/sales': 'http://localhost:8787',
      '/api/sekolah': 'http://localhost:8787',
      '/api/buku': 'http://localhost:8787',
      '/api/inventory': 'http://localhost:8788',
      '/api/allocate': 'http://localhost:8788',
      '/api/allocations': 'http://localhost:8788',
    },
  },
})
