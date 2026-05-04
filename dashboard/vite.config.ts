import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies /api/* -> http://localhost:8080/*
// so the browser app never hits the Go backend cross-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
