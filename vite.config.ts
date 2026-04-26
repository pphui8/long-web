import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://llm.pphui8.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        onProxyRes: (proxyRes) => {
          const setCookie = proxyRes.headers['set-cookie'];
          if (setCookie) {
            // Robustly strip Secure, Domain, and SameSite=None to allow localhost cookie storage
            proxyRes.headers['set-cookie'] = setCookie.map((s) => {
              return s
                .split(';')
                .map(part => part.trim())
                .filter(part => {
                  const lower = part.toLowerCase();
                  return !lower.startsWith('secure') && 
                         !lower.startsWith('domain') &&
                         !lower.startsWith('samesite') &&
                         !lower.startsWith('partitioned');
                })
                .join('; ') + '; SameSite=Lax';
            });
          }
        },
      },
    },
  },
})
