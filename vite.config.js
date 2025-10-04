import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'
import inspect from 'vite-plugin-inspect'

export default defineConfig({
    plugins: [react({
        include: '**/*.jsx',
    }), compression(), inspect()],
    build: {
        outDir: "build", // falls du CRA-Kompatibilität brauchst
        rollupOptions: {
            output: {
                entryFileNames: "assets/[name].[hash].js",
                chunkFileNames: "assets/[name].[hash].js",
                assetFileNames: "assets/[name].[hash][extname]",
            },
        },
    },
    base: "/controllers/static/",
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        watch: {
            usePolling: true,  // Aktiviert Polling, nützlich in virtuellen Umgebungen
            interval: 100,     // Setzt das Polling-Intervall auf 100ms
        },
        hrm: true
    }
})
