import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        TanStackRouterVite({
            autoCodeSplitting: true,
        }),
        react(),
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
            },
        },
    },
});
