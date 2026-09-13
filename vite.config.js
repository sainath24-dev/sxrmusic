import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyPlugin = () => ({
  name: 'media-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith('/api/proxy?url=')) {
        try {
          const targetUrl = decodeURIComponent(req.url.slice('/api/proxy?url='.length));
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          const text = await response.text();
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(text);
          return;
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), proxyPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})

