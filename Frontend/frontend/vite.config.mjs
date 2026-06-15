import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.js$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
        // Pre-bundle heavy deps so dev server doesn't block on first request
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'axios',
            'react-toastify',
            'react-icons/fa',
            'react-icons/fi',
        ],
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'build',
        // Raise the inline limit so small assets don't force extra HTTP requests
        assetsInlineLimit: 4096,
        rollupOptions: {
            output: {
                // Split the bundle into logical chunks so browsers can cache
                // stable vendor code separately from app code.
                manualChunks(id) {
                    // MediaPipe AI libs — huge, rarely changes
                    if (id.includes('@mediapipe')) {
                        return 'vendor-mediapipe';
                    }
                    // PDF / canvas generation
                    if (id.includes('jspdf') || id.includes('html2canvas')) {
                        return 'vendor-pdf';
                    }
                    // Charting
                    if (id.includes('recharts') || id.includes('d3-')) {
                        return 'vendor-charts';
                    }
                    // Animation
                    if (id.includes('framer-motion')) {
                        return 'vendor-motion';
                    }
                    // i18n
                    if (id.includes('i18next')) {
                        return 'vendor-i18n';
                    }
                    // Icons (large package with many sub-paths)
                    if (id.includes('react-icons')) {
                        return 'vendor-icons';
                    }
                    // Core React runtime
                    if (id.includes('react-dom') || id.includes('react-router')) {
                        return 'vendor-react';
                    }
                    // Everything else in node_modules → one vendor chunk
                    if (id.includes('node_modules')) {
                        return 'vendor-misc';
                    }
                },
            },
        },
    },
})
