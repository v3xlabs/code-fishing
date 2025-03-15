import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        TanStackRouterVite({
            autoCodeSplitting: true,
        }),
        tsconfigPaths(),
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
