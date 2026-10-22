/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // No GitHub Pages o site fica em /<repositório>/; o workflow de deploy define CAMINHO_BASE.
  base: process.env.CAMINHO_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // O maior pedaço é a biblioteca de Excel (SheetJS, ~870 kB). Ela é carregada
    // sob demanda, só ao importar ou exportar, e nunca no carregamento das telas.
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Permite que tema.test.ts leia os tokens de index.css via `?raw`.
    css: { include: [/index\.css/] },
  },
})
