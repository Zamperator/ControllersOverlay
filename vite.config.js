import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'
import inspect from 'vite-plugin-inspect'

export default defineConfig({
    plugins: [react({
        include: '**/*.jsx',
    }), compression(), inspect()],
    build: {
        outDir: "build",
        rollupOptions: {
            output: {
                manualChunks: () => 'bundle' // erzwingt einen JS-Chunk
            },
        },
    },
    base: "./",
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        fs: {
            allow: ['..']
        },
        watch: {
            usePolling: true,  // Aktiviert Polling, nützlich in virtuellen Umgebungen
            interval: 100,     // Setzt das Polling-Intervall auf 100ms
        },
        hrm: true
    }
})
