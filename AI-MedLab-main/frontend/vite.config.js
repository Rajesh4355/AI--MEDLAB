import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitepluginrewriteall from "vite-plugin-rewrite-all";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  envDir: path.resolve(__dirname, "../.."),
  plugins: [react(), vitepluginrewriteall()],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: "all",
  },
});
