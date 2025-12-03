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
                manualChunks: () => 'bundle'
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
            usePolling: true,
            interval: 100,
        },
        hrm: true
    }
})
