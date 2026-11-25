import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import envCompatible from 'vite-plugin-env-compatible';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [
        react(),
        svgr(),
        envCompatible({ prefix: 'REACT_APP_' })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        host: true, // Listen on all addresses
        strictPort: false,
        hmr: {
            clientPort: 5173,
        },
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
            '/ws': {
                target: 'http://127.0.0.1:8000',
                ws: true,
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'build',
    },
});
