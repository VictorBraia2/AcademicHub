import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend é servido pelo Vercel; as funções em /api rodam como
// Vercel Serverless Functions e são acessadas via fetch("/api/...").
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Espelha o path alias "@/*" declarado em tsconfig.json — o TypeScript
      // só verifica tipos, quem resolve o import em tempo de build é o Vite.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
