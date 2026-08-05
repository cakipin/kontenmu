import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(appDir, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@repo/api": path.resolve(rootDir, "packages/api/src/index.ts"),
      "@repo/auth": path.resolve(rootDir, "packages/auth/src/index.ts"),
    },
  },
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      allow: [rootDir],
    },
    proxy: {
      "/api/auth/sso": {
        target: "https://kontenmu.pages.dev",
        changeOrigin: true,
      },
      "/api/sales": "http://127.0.0.1:8787",
      "/api/sekolah": "http://127.0.0.1:8787",
      "/api/buku": "http://127.0.0.1:8787",
      "/api/users": "http://127.0.0.1:8787",
      "/api/auth": "http://127.0.0.1:8787",
      "/api/inventory": "http://127.0.0.1:8788",
      "/api/allocate": "http://127.0.0.1:8788",
      "/api/allocations": "http://127.0.0.1:8788",
    },
  },
});
