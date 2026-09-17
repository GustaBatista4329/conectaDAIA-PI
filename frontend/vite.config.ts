import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/', // Railway serve na raiz do domínio (era '/conectaDAIA-PI-frontend/' pro GitHub Pages)
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    watch: {
      // No ambiente docker compose de dev (Windows + bind mount), o watcher
      // nativo do Vite (chokidar/fsevents) não recebe eventos de mudança de
      // arquivo de forma confiável — edições no host não disparavam HMR nem
      // invalidavam o cache de transform do Vite, fazendo o navegador rodar
      // código desatualizado silenciosamente. Polling resolve isso.
      usePolling: true,
      interval: 300,
    },
  },
})
