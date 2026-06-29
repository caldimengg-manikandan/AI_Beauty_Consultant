import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Separate, minimal Vitest config (kept apart from vite.config.mjs so the
// production build config stays untouched). `npm test` previously ran
// "react-scripts test", but this project uses Vite, not Create React App —
// react-scripts is not installed, so the script just failed with a
// "command not found" error. This wires up Vitest (the standard test
// runner in the Vite ecosystem) against the @testing-library/* packages
// that were already listed as dependencies but had no runner to use them.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
    },
})
