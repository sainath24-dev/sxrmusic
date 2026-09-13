import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyPlugin = () => ({
  name: 'media-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // Handle /api/spotify
      if (req.url && req.url.startsWith('/api/spotify?url=')) {
        try {
          const targetUrl = decodeURIComponent(req.url.slice('/api/spotify?url='.length));
          let embedUrl = targetUrl;
          if (targetUrl.includes('spotify.com/playlist/')) {
            const playlistId = targetUrl.split('playlist/')[1].split('?')[0];
            embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
          } else if (targetUrl.includes('spotify.com/album/')) {
            const albumId = targetUrl.split('album/')[1].split('?')[0];
            embedUrl = `https://open.spotify.com/embed/album/${albumId}`;
          } else if (targetUrl.includes('spotify.com/track/')) {
            const trackId = targetUrl.split('track/')[1].split('?')[0];
            embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
          }

          const response = await fetch(embedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          });

          const html = await response.text();
          const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
          if (!match) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'No NEXT_DATA found' }));
            return;
          }

          const nextData = JSON.parse(match[1]);
          const entity = nextData?.props?.pageProps?.state?.data?.entity;
          const name = entity?.name || entity?.title || 'Spotify Playlist';
          let tracks = [];
          if (entity?.trackList && entity.trackList.length > 0) {
            tracks = entity.trackList.map(t => ({
              title: t.title,
              artist: t.subtitle || '',
              query: `${t.title} ${t.subtitle || ''}`.trim()
            }));
          }

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ success: true, name, total: tracks.length, tracks }));
          return;
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }

      // Handle /api/proxy
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
