import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(appDir, '../..')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@repo/api': path.resolve(rootDir, 'packages/api/src/index.ts'),
      '@repo/auth': path.resolve(rootDir, 'packages/auth/src/index.ts'),
    },
  },
  server: {
    port: 5174,
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
