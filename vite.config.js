import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'
import inspect from 'vite-plugin-inspect'
import pkg from './package.json'

export default defineConfig({
    plugins: [react({
        include: '**/*.jsx',
    }), compression(), inspect()],
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
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
        hmr: true
    }
})
