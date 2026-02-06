import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Use one target at runtime; allow switching via env
const BACKEND_TARGET = process.env.VITE_BACKEND_TARGET || 'http://127.0.0.1:8001'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@services': path.resolve(__dirname, './src/services'),
            '@store': path.resolve(__dirname, './src/store'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@types': path.resolve(__dirname, './src/types'),
        },
    },
    server: {
        port: 3000,
        middlewareMode: false,
        proxy: {
            '/api': {
                // Proxy API calls to the backend during local dev
                target: BACKEND_TARGET,
                changeOrigin: true,  // Changed to true to properly handle Host headers
                timeout: 30 * 60 * 1000, // 30 minutes for long operations like tenant creation
                proxyTimeout: 30 * 60 * 1000, // Allow backend up to 30 minutes
                // Preserve the original host header for tenant routing
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq, req) => {
                        // Forward custom tenant headers if present
                        if (req.headers['x-tenant-slug']) {
                            proxyReq.setHeader('X-Tenant-Slug', req.headers['x-tenant-slug'] as string)
                        }
                        if (req.headers['x-tenant-id']) {
                            proxyReq.setHeader('X-Tenant-ID', req.headers['x-tenant-id'] as string)
                        }
                        // Don't timeout the socket for long operations
                        proxyReq.setTimeout(30 * 60 * 1000)
                    })
                }
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('recharts')) {
                            return 'vendor-charts';
                        }
                        if (id.includes('@tanstack') || id.includes('axios')) {
                            return 'vendor-utils';
                        }
                        return 'vendor'; // Default vendor chunk
                    }
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
})
