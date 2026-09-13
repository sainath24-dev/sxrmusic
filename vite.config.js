import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyPlugin = () => ({
  name: 'media-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // Handle /api/youtube
      if (req.url && req.url.startsWith('/api/youtube?url=')) {
        try {
          const targetUrl = decodeURIComponent(req.url.slice('/api/youtube?url='.length));
          let playlistId = null;
          if (targetUrl.includes('list=')) {
            playlistId = targetUrl.split('list=')[1].split('&')[0];
          } else if (targetUrl.startsWith('PL') || targetUrl.startsWith('UU') || targetUrl.startsWith('OLAK5uy_') || targetUrl.startsWith('RD')) {
            playlistId = targetUrl;
          }

          if (playlistId) {
            const browseRes = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              body: JSON.stringify({
                context: {
                  client: {
                    clientName: 'WEB_REMIX',
                    clientVersion: '1.20240101.00.00',
                    hl: 'en',
                    gl: 'US'
                  }
                },
                browseId: playlistId.startsWith('VL') ? playlistId : `VL${playlistId}`
              })
            });

            const data = await browseRes.json();
            const tracks = [];
            let playlistTitle = 'YouTube Playlist';

            const searchForTracks = (obj) => {
              if (!obj || typeof obj !== 'object') return;
              if (obj.playlistHeaderRenderer?.title?.runs?.[0]?.text) {
                playlistTitle = obj.playlistHeaderRenderer.title.runs[0].text;
              } else if (obj.musicDetailHeaderRenderer?.title?.runs?.[0]?.text) {
                playlistTitle = obj.musicDetailHeaderRenderer.title.runs[0].text;
              }

              if (obj.musicResponsiveListItemRenderer) {
                const flexColumns = obj.musicResponsiveListItemRenderer.flexColumns;
                if (flexColumns && flexColumns.length > 0) {
                  const title = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
                  let artist = '';
                  if (flexColumns.length > 1) {
                    artist = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map(r => r.text).join('') || '';
                  }
                  if (title && title !== '[Private video]' && title !== '[Deleted video]') {
                    tracks.push({ title, artist, query: `${title} ${artist}`.trim() });
                  }
                }
              } else if (obj.playlistVideoRenderer) {
                const title = obj.playlistVideoRenderer.title?.runs?.[0]?.text || obj.playlistVideoRenderer.title?.simpleText;
                const artist = obj.playlistVideoRenderer.shortBylineText?.runs?.[0]?.text || '';
                if (title && title !== '[Private video]' && title !== '[Deleted video]') {
                  tracks.push({ title, artist, query: `${title} ${artist}`.trim() });
                }
              }
              Object.values(obj).forEach(searchForTracks);
            };

            searchForTracks(data);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, name: playlistTitle, total: tracks.length, tracks }));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'No playlist ID found' }));
          return;
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }

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
