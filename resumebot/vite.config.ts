import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET
    || (env.VITE_API_URL ? env.VITE_API_URL.replace(/\/api\/?$/, '') : '')
    || `http://localhost:${env.PORT || 3007}`;

  return {
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@tabler/icons-react': fileURLToPath(
        new URL('./node_modules/@tabler/icons-react/dist/cjs/tabler-icons-react.cjs', import.meta.url)
      )
    }
  },
  server: {
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true, // Use polling for file watching (helps with network issues)
    },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true
      }
    }
  }
  };
})
